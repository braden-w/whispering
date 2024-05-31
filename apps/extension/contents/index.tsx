import cssText from 'data-text:~/style.css';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
	matches: ['https://www.plasmo.com/*'],
};

export const getStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};

const PlasmoContent = () => {
	return (
		<div className="fixed inset-5">
			<button className="mb-2 mr-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:outline-none">
				HELLO WORLD
			</button>
		</div>
	);
};

export default PlasmoContent;
