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

const topicsByCategory: Record<Exclude<ExploreRequest['category'], 'custom' | 'surprise'>, string[]> = {
	history: ['ancient civilizations', 'medieval history', 'lost cities', 'historical mysteries', 'ancient inventions'],

	nature: ['bioluminescence', 'deep sea ecosystems', 'rare natural phenomena', 'ancient forests', 'volcanoes'],

	animals: ['octopus intelligence', 'axolotl', 'tardigrade', 'lyrebird', 'animal cognition'],

	space: ['exoplanets', 'black holes', 'neutron stars', 'Jupiter moons', 'deep space'],

	places: ['remote islands', 'underground cities', 'ancient villages', 'unusual landscapes', 'abandoned places'],

	curiosities: [
		'strange historical facts',
		'unusual scientific discoveries',
		'unexpected inventions',
		'rare phenomena',
		'curious coincidences',
	],

	psychology: ['memory psychology', 'dream psychology', 'cognitive biases', 'déjà vu', 'human perception'],

	mysteries: ['unsolved historical mysteries', 'folklore legends', 'mysterious manuscripts', 'ghost ships', 'ancient legends'],

	crime: ['historical criminal cases', 'unsolved crimes', 'forensic science history', 'famous investigations', 'criminal psychology'],
};

const getRandomItem = <T>(items: T[]): T => {
	return items[Math.floor(Math.random() * items.length)];
};

const getSearchQuery = (body: ExploreRequest): string => {
	if (body.category === 'custom') {
		return body.customTopic?.trim() || '';
	}

	if (body.category === 'surprise') {
		const categories = Object.keys(topicsByCategory) as (keyof typeof topicsByCategory)[];

		const randomCategory = getRandomItem(categories);

		return getRandomItem(topicsByCategory[randomCategory]);
	}

	return getRandomItem(topicsByCategory[body.category]);
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
): Promise<string> => {
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
	});

	const content = response.choices?.[0]?.message?.content;

	if (!content || typeof content !== 'string') {
		throw new Error('AI returned no readable content.');
	}

	return content.trim();
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

				const query = getSearchQuery(body);

				if (!query) {
					return Response.json(
						{
							error: 'Missing search topic.',
						},
						{
							status: 400,
							headers: corsHeaders,
						},
					);
				}

				const pages = await searchWikipedia(query, body.language);

				const page = pages[0];

				if (!page) {
					return Response.json(
						{
							error: 'No Wikipedia page found.',
						},
						{
							status: 404,
							headers: corsHeaders,
						},
					);
				}

				const extract = await getWikipediaExtract(page.title, body.language);
				const sourceMaterial = extract.slice(0, 12000);

				const wikiBaseUrl = body.language === 'it' ? 'https://it.wikipedia.org/wiki/' : 'https://en.wikipedia.org/wiki/';

				const generatedContent = await generateReadingWithAI(env, page.title, sourceMaterial, body.language, body.length);

				return Response.json(
					{
						reading: {
							title: page.title,
							content: sourceMaterial,

							sources: [
								{
									title: `Wikipedia — ${page.title}`,
									url: `${wikiBaseUrl}${encodeURIComponent(page.key)}`,
								},
							],
						},

						debug: {
							query,
							category: body.category,
							sourceLength: extract.length,
						},
					},
					{
						headers: corsHeaders,
					},
				);
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

		return new Response('Not found', {
			status: 404,
			headers: corsHeaders,
		});
	},
} satisfies ExportedHandler<Env>;
