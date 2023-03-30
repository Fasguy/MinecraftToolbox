export function keySplitter(key: string) {
	let matches = key.match(/[^[\]]+/g)!;
	let lastKey;
	if (key.length > 1) {
		let arrayIndicatorIndex = key.indexOf("[]");
		if (arrayIndicatorIndex > -1 && arrayIndicatorIndex === key.length - 2) {
			lastKey = matches.pop();
			matches.push(<any>[lastKey!]);
		}
	}

	return matches;
}