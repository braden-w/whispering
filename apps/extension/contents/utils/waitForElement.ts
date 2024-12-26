export const waitForElement = (selector: string): Promise<Element> =>
	new Promise((resolve, reject) => {
		const element = document.querySelector(selector);
		if (element) return resolve(element);

		const observer = new MutationObserver((mutations) => {
			for (const _ of mutations) {
				const element = document.querySelector(selector);
				if (element) {
					resolve(element);
					observer.disconnect();
				}
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		// Optional timeout to prevent indefinite waiting
		setTimeout(() => {
			observer.disconnect();
			reject(
				new Error(
					`Element with selector "${selector}" not found within timeout`,
				),
			);
		}, 10000); // Adjust timeout as needed
	});
