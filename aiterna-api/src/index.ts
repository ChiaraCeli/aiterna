interface ExploreRequest {
	category:
		| 'surprise'
		| 'history'
		| 'nature'
		| 'animals'
		| 'space'
		| 'places'
		| 'curiosities'
		| 'psychology'
		| 'mysteries'
		| 'crime'
		| 'custom';
	length: 'short' | 'medium' | 'long';
	customTopic?: string;
	language: 'it' | 'en';
	recentArticleIds?: number[];
}

interface ExploreContinueRequest {
	title: string;
	previousContent: string;
	sourceUrl: string;
	language: 'it' | 'en';
}

interface WikipediaSearchPage {
	id: number;
	key: string;
	title: string;
	excerpt: string;
	description: string | null;
}

interface WikipediaSearchResponse {
	pages: WikipediaSearchPage[];
}

interface WikipediaExtractPage {
	pageid: number;
	ns: number;
	title: string;
	extract?: string;
}

interface WikipediaExtractResponse {
	query?: {
		pages: Record<string, WikipediaExtractPage>;
	};
}

const corsHeaders = {
	'Access-Control-Allow-Origin': 'http://localhost:5173',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

const wikipediaCategories: Partial<Record<ExploreRequest['category'], { it: string[]; en: string[] }>> = {
	animals: {
		it: ['Categoria:Zoologia'],
		en: ['Category:Zoology'],
	},
	history: {
		it: ['Categoria:Storia'],
		en: ['Category:History'],
	},
	nature: {
		it: ['Categoria:Natura'],
		en: ['Category:Nature'],
	},
	space: {
		it: ['Categoria:Astronomia'],
		en: ['Category:Astronomy'],
	},
	places: {
		it: ['Categoria:Geografia'],
		en: ['Category:Geography'],
	},

	curiosities: {
		it: ['Categoria:Scienza', 'Categoria:Tecnologia', 'Categoria:Storia', 'Categoria:Fenomeni naturali'],
		en: ['Category:Science', 'Category:Technology', 'Category:History', 'Category:Natural phenomena'],
	},

	psychology: {
		it: ['Categoria:Psicologia', 'Categoria:Processi cognitivi'],
		en: ['Category:Psychology', 'Category:Cognitive processes'],
	},
	mysteries: {
		it: ['Categoria:Folclore', 'Categoria:Mitologia'],
		en: ['Category:Folklore', 'Category:Mythology'],
	},
	crime: {
		it: ['Categoria:Criminologia', 'Categoria:Criminalità'],
		en: ['Category:Criminology', 'Category:Crime'],
	},
};

const searchWikipedia = async (query: string, language: ExploreRequest['language']) => {
	const wikipediaLanguage = language === 'it' ? 'it' : 'en';

	const url = new URL(`https://${wikipediaLanguage}.wikipedia.org/w/rest.php/v1/search/page`);

	url.searchParams.set('q', query);
	url.searchParams.set('limit', '5');

	const response = await fetch(url.toString(), {
		headers: {
			'User-Agent': 'AIterna/0.1',
		},
	});

	if (!response.ok) {
		throw new Error(`Wikipedia request failed: ${response.status}`);
	}

	const data = await response.json<WikipediaSearchResponse>();

	return data.pages;
};

const getRandomWikipediaPage = async (language: ExploreRequest['language']): Promise<WikipediaSearchPage> => {
	const wikipediaLanguage = language === 'it' ? 'it' : 'en';

	const url = new URL(`https://${wikipediaLanguage}.wikipedia.org/w/api.php`);

	url.searchParams.set('action', 'query');
	url.searchParams.set('format', 'json');
	url.searchParams.set('generator', 'random');
	url.searchParams.set('grnnamespace', '0');
	url.searchParams.set('grnlimit', '1');

	const response = await fetch(url.toString(), {
		headers: {
			'User-Agent': 'AIterna/0.1',
		},
	});

	if (!response.ok) {
		throw new Error(`Wikipedia random request failed: ${response.status}`);
	}

	const data = await response.json<{
		query?: {
			pages: Record<
				string,
				{
					pageid: number;
					ns: number;
					title: string;
				}
			>;
		};
	}>();

	const page = Object.values(data.query?.pages ?? {})[0];

	if (!page) {
		throw new Error('No random Wikipedia page found.');
	}

	return {
		id: page.pageid,
		key: page.title.replace(/ /g, '_'),
		title: page.title,
		excerpt: '',
		description: null,
	};
};

interface WikipediaCategoryMember {
	pageid: number;
	ns: number;
	title: string;
}

const categoryCache = new Map<
	string,
	{
		members: WikipediaCategoryMember[];
		expiresAt: number;
	}
>();

const CATEGORY_CACHE_TTL = 30 * 60 * 1000;

const getWikipediaCategoryMembers = async (category: string, language: ExploreRequest['language']): Promise<WikipediaCategoryMember[]> => {
	const wikipediaLanguage = language === 'it' ? 'it' : 'en';

	const cacheKey = `${wikipediaLanguage}:${category}`;

	const cached = categoryCache.get(cacheKey);

	if (cached && cached.expiresAt > Date.now()) {
		return cached.members;
	}

	const maxPages = 1;
	const members: WikipediaCategoryMember[] = [];

	let continueToken: string | undefined;

	for (let page = 0; page < maxPages; page++) {
		const url = new URL(`https://${wikipediaLanguage}.wikipedia.org/w/api.php`);

		url.searchParams.set('action', 'query');
		url.searchParams.set('format', 'json');
		url.searchParams.set('list', 'categorymembers');
		url.searchParams.set('cmtitle', category);
		url.searchParams.set('cmtype', 'page|subcat');
		url.searchParams.set('cmlimit', '100');

		if (continueToken) {
			url.searchParams.set('cmcontinue', continueToken);
		}

		const response = await fetch(url.toString(), {
			headers: {
				'User-Agent': 'AIterna/0.1',
			},
		});

		if (!response.ok) {
			throw new Error(`Wikipedia category request failed: ${response.status}`);
		}

		const data = await response.json<{
			continue?: {
				cmcontinue?: string;
			};
			query?: {
				categorymembers: WikipediaCategoryMember[];
			};
		}>();

		members.push(...(data.query?.categorymembers ?? []));

		continueToken = data.continue?.cmcontinue;

		if (!continueToken) {
			break;
		}
	}

	categoryCache.set(cacheKey, {
		members,
		expiresAt: Date.now() + CATEGORY_CACHE_TTL,
	});

	return members;
};

const isRecentArticle = (articleId: number, recentArticleIds: number[] = []): boolean => {
	return recentArticleIds.includes(articleId);
};

const getRandomArticleFromCategory = async (
	rootCategory: string,
	language: ExploreRequest['language'],
	recentArticleIds: number[] = [],
): Promise<{ page: WikipediaSearchPage; extract: string } | null> => {
	const maxDepth = 3;
	const maxAttempts = 3;
	const minExtractLength = 1000;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		let currentCategory = rootCategory;
		const visitedCategories = new Set<string>();

		for (let depth = 0; depth < maxDepth; depth++) {
			if (visitedCategories.has(currentCategory)) {
				break;
			}

			visitedCategories.add(currentCategory);

			const members = await getWikipediaCategoryMembers(currentCategory, language);

			const articles = members.filter((member) => member.ns === 0 && !isRecentArticle(member.pageid, recentArticleIds));

			const subcategories = members.filter((member) => member.ns === 14);

			const exploreSubcategory = subcategories.length > 0 && (articles.length === 0 || Math.random() < 0.65) && depth < maxDepth - 1;

			if (exploreSubcategory) {
				const randomIndex = Math.floor(Math.random() * subcategories.length);

				currentCategory = subcategories[randomIndex]!.title;
				continue;
			}

			if (articles.length > 0) {
				const randomIndex = Math.floor(Math.random() * articles.length);

				const selectedArticle = articles[randomIndex]!;

				let extract = '';

				try {
					extract = await getWikipediaExtract(selectedArticle.title, language);
				} catch (error) {
					console.warn(`Skipping Wikipedia article: ${selectedArticle.title}`, error);
				}

				if (extract.trim().length >= minExtractLength) {
					return {
						page: {
							id: selectedArticle.pageid,
							key: selectedArticle.title.replace(/ /g, '_'),
							title: selectedArticle.title,
							excerpt: '',
							description: null,
						},
						extract,
					};
				}
			}

			break;
		}
	}

	return null;
};

const getWikipediaExtract = async (title: string, language: ExploreRequest['language']): Promise<string> => {
	const wikipediaLanguage = language === 'it' ? 'it' : 'en';

	const url = new URL(`https://${wikipediaLanguage}.wikipedia.org/w/api.php`);

	url.searchParams.set('action', 'query');
	url.searchParams.set('format', 'json');
	url.searchParams.set('prop', 'extracts');
	url.searchParams.set('explaintext', '1');
	url.searchParams.set('redirects', '1');
	url.searchParams.set('titles', title);

	const response = await fetch(url.toString(), {
		headers: {
			'User-Agent': 'AIterna/0.1',
		},
	});

	if (!response.ok) {
		throw new Error(`Wikipedia extract request failed: ${response.status}`);
	}

	const data = await response.json<WikipediaExtractResponse>();

	const pages = data.query?.pages;

	if (!pages) {
		throw new Error('Wikipedia page content not found.');
	}

	const page = Object.values(pages)[0];

	if (!page?.extract) {
		throw new Error('Wikipedia page has no readable extract.');
	}

	return page.extract;
};

const generateReadingWithAI = async (
	env: Env,
	sourceTitle: string,
	sourceText: string,
	language: ExploreRequest['language'],
	length: ExploreRequest['length'],
): Promise<ReadableStream> => {
	const languageInstruction = language === 'it' ? 'Scrivi in italiano.' : 'Write in English.';

	const lengthInstruction = {
		short: 'Keep the reading relatively short, around 500-700 words.',
		medium: 'Write a medium-length reading, around 900-1200 words.',
		long: 'Write a longer reading, around 1600-2200 words.',
	}[length];

	const response = await env.AI.run('@cf/google/gemma-4-26b-a4b-it', {
		messages: [
			{
				role: 'system',
				content: `
You are the writing engine of AIterna, a calm generative reading application.

Your job is to transform factual source material into an immersive, conversational reading experience.

Rules:
- Use ONLY factual information supported by the provided source.
- Never invent facts, dates, names or events.
- Do not sound like an encyclopedia.
- Do not write like an academic essay.
- Write as if an intelligent, relaxed person were telling the reader something fascinating.
- Use natural paragraphs.
- Avoid bullet points unless absolutely necessary.
- Avoid headings inside the reading.
- Do not mention Wikipedia or "the source" in the text.
- Do not add citations inside the text.
- Keep the tone calm, curious, narrative and conversational.
- Make the opening inviting rather than formal.
          `.trim(),
			},
			{
				role: 'user',
				content: `
${languageInstruction}

${lengthInstruction}

Topic:
${sourceTitle}

FACTUAL SOURCE MATERIAL:

${sourceText}
          `.trim(),
			},
		],

		chat_template_kwargs: {
			enable_thinking: false,
		},
		stream: true,
	});

	return response;
};

const continueReadingWithAI = async (
	env: Env,
	title: string,
	sourceText: string,
	previousContent: string,
	language: 'it' | 'en',
): Promise<ReadableStream> => {
	const languageInstruction = language === 'it' ? 'Scrivi in italiano.' : 'Write in English.';

	const response = await env.AI.run('@cf/google/gemma-4-26b-a4b-it', {
		messages: [
			{
				role: 'system',
				content: `
You are the writing engine of AIterna,
a calm generative reading application.

Continue an existing reading about the same topic.

Rules:
- Use ONLY factual information supported by the source material.
- Never invent facts, dates, names or events.
- Do not repeat information already explained.
- Explore a new detail or a different aspect of the topic.
- Maintain a calm, immersive and conversational tone.
- Use natural paragraphs.
- Do not use headings or bullet points.
- Do not restart the introduction.
- Do not mention Wikipedia or the source.
- Write approximately 300-500 words.
          `.trim(),
			},
			{
				role: 'user',
				content: `
${languageInstruction}

TOPIC:
${title}

FACTUAL SOURCE MATERIAL:
${sourceText}

PREVIOUS READING:
${previousContent}

Continue the reading naturally,
exploring something new without repeating
what has already been said.
          `.trim(),
			},
		],
		chat_template_kwargs: {
			enable_thinking: false,
		},
		stream: true,
	});

	return response;
};

const createSSEEvent = (event: string, data: unknown): string => {
	return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
};

const createAIStreamResponse = (
	aiStream: ReadableStream,

	metadata?: {
		title: string;
		articleId?: number;
		sources: { title: string; url: string }[];
	},
): Response => {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const send = (event: string, data: unknown) => {
				controller.enqueue(encoder.encode(createSSEEvent(event, data)));
			};

			if (metadata) {
				send('metadata', metadata);
			}

			const reader = aiStream.getReader();
			let buffer = '';

			const processEvent = (rawEvent: string) => {
				const data = rawEvent
					.split('\n')
					.filter((line) => line.startsWith('data:'))
					.map((line) => line.slice(5).trimStart())
					.join('\n');

				if (!data || data === '[DONE]') return;

				try {
					const parsed = JSON.parse(data);

					const content = parsed.response ?? parsed.choices?.[0]?.delta?.content;

					if (typeof content === 'string' && content) {
						send('chunk', { content });
					}
				} catch {
					console.warn('Unrecognized AI stream event');
				}
			};

			try {
				while (true) {
					const { done, value } = await reader.read();

					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					buffer = buffer.replace(/\r\n/g, '\n');

					const events = buffer.split('\n\n');
					buffer = events.pop() ?? '';

					for (const rawEvent of events) {
						processEvent(rawEvent);
					}
				}

				buffer += decoder.decode();

				if (buffer.trim()) {
					processEvent(buffer);
				}

				send('done', {});
			} catch (error) {
				console.error('AI streaming error:', error);

				send('error', {
					message: 'Unable to complete reading.',
				});
			} finally {
				reader.releaseLock();
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			...corsHeaders,
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache',
			'X-Content-Type-Options': 'nosniff',
		},
	});
};

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		if (request.method === 'POST' && url.pathname === '/api/explore') {
			try {
				const body = await request.json<ExploreRequest>();

				let page: WikipediaSearchPage;
				let extract = '';

				if (body.category === 'surprise') {
					const maxAttempts = 5;
					const minExtractLength = 1000;

					let validPage: WikipediaSearchPage | null = null;

					for (let attempt = 0; attempt < maxAttempts; attempt++) {
						const randomPage = await getRandomWikipediaPage(body.language);

						if (isRecentArticle(randomPage.id, body.recentArticleIds ?? [])) {
							continue;
						}

						const randomExtract = await getWikipediaExtract(randomPage.title, body.language);

						if (randomExtract.trim().length >= minExtractLength) {
							validPage = randomPage;
							extract = randomExtract;
							break;
						}
					}

					if (!validPage) {
						return Response.json({ error: 'Unable to find a suitable Wikipedia article.' }, { status: 404, headers: corsHeaders });
					}

					page = validPage;
				} else if (wikipediaCategories[body.category]) {
					const categoryConfig = wikipediaCategories[body.category];

					if (!categoryConfig) {
						throw new Error('Wikipedia category not configured.');
					}

					const rootCategories = [...categoryConfig[body.language]];

					for (let i = rootCategories.length - 1; i > 0; i--) {
						const j = Math.floor(Math.random() * (i + 1));

						[rootCategories[i], rootCategories[j]] = [rootCategories[j]!, rootCategories[i]!];
					}

					let result: Awaited<ReturnType<typeof getRandomArticleFromCategory>> = null;

					for (const rootCategory of rootCategories) {
						result = await getRandomArticleFromCategory(rootCategory, body.language, body.recentArticleIds ?? []);

						if (result) {
							break;
						}
					}

					if (!result && (body.recentArticleIds?.length ?? 0) > 0) {
						for (const rootCategory of rootCategories) {
							result = await getRandomArticleFromCategory(rootCategory, body.language, []);

							if (result) {
								break;
							}
						}
					}

					if (!result) {
						return Response.json({ error: 'Unable to find a suitable Wikipedia article.' }, { status: 404, headers: corsHeaders });
					}

					page = result.page;
					extract = result.extract;
				} else {
					if (body.category !== 'custom') {
						return Response.json({ error: 'Unsupported category.' }, { status: 400, headers: corsHeaders });
					}

					const query = body.customTopic?.trim();

					if (!query) {
						return Response.json({ error: 'Missing search topic.' }, { status: 400, headers: corsHeaders });
					}

					const pages = await searchWikipedia(query, body.language);

					const selectedPage = pages[0];

					if (!selectedPage) {
						return Response.json({ error: 'No Wikipedia page found.' }, { status: 404, headers: corsHeaders });
					}

					page = selectedPage;
					extract = await getWikipediaExtract(page.title, body.language);
				}

				const sourceMaterial = extract.slice(0, 12000);

				const wikiBaseUrl = body.language === 'it' ? 'https://it.wikipedia.org/wiki/' : 'https://en.wikipedia.org/wiki/';

				const aiStream = await generateReadingWithAI(env, page.title, sourceMaterial, body.language, body.length);

				return createAIStreamResponse(aiStream, {
					title: page.title,
					articleId: page.id,
					sources: [
						{
							title: `Wikipedia — ${page.title}`,
							url: `${wikiBaseUrl}${encodeURIComponent(page.key)}`,
						},
					],
				});
			} catch (error) {
				console.error(error);

				return Response.json(
					{
						error: 'Unable to retrieve Wikipedia content.',
					},
					{
						status: 500,
						headers: corsHeaders,
					},
				);
			}
		}

		if (request.method === 'POST' && url.pathname === '/api/explore/continue') {
			try {
				const body = await request.json<ExploreContinueRequest>();

				if (
					typeof body.title !== 'string' ||
					!body.title.trim() ||
					typeof body.previousContent !== 'string' ||
					!body.previousContent.trim() ||
					typeof body.sourceUrl !== 'string' ||
					(body.language !== 'it' && body.language !== 'en')
				) {
					return Response.json({ error: 'Invalid continuation request.' }, { status: 400, headers: corsHeaders });
				}

				if (body.title.length > 300 || body.previousContent.length > 20000) {
					return Response.json({ error: 'Reading context is too long.' }, { status: 400, headers: corsHeaders });
				}

				let sourceUrl: URL;

				try {
					sourceUrl = new URL(body.sourceUrl);
				} catch {
					return Response.json({ error: 'Invalid source URL.' }, { status: 400, headers: corsHeaders });
				}

				const expectedHost = body.language === 'it' ? 'it.wikipedia.org' : 'en.wikipedia.org';

				if (
					sourceUrl.protocol !== 'https:' ||
					sourceUrl.hostname !== expectedHost ||
					sourceUrl.port !== '' ||
					sourceUrl.username !== '' ||
					sourceUrl.password !== '' ||
					!sourceUrl.pathname.startsWith('/wiki/') ||
					sourceUrl.pathname.length <= '/wiki/'.length
				) {
					return Response.json({ error: 'Unsupported source URL.' }, { status: 400, headers: corsHeaders });
				}

				const pageKey = sourceUrl.pathname.slice('/wiki/'.length);
				const pageTitle = decodeURIComponent(pageKey).replace(/_/g, ' ');

				const extract = await getWikipediaExtract(pageTitle, body.language);

				const sourceMaterial = extract.slice(0, 12000);

				// 4. Generiamo la continuazione con l'AI.
				const aiStream = await continueReadingWithAI(env, pageTitle, sourceMaterial, body.previousContent, body.language);

				// 5. Restituiamo lo streaming SSE.
				return createAIStreamResponse(aiStream);
			} catch (error) {
				console.error('Explore continuation error:', error);

				return Response.json({ error: 'Unable to continue reading.' }, { status: 500, headers: corsHeaders });
			}
		}

		return new Response('Not found', {
			status: 404,
			headers: corsHeaders,
		});
	},
} satisfies ExportedHandler<Env>;
