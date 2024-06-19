export const WHISPERING_URL =
	process.env.NODE_ENV === 'production'
		? 'https://whispering.bradenwong.com'
		: 'http://localhost:5173';
export const WHISPERING_URL_WILDCARD = `${WHISPERING_URL}/*` as const;
