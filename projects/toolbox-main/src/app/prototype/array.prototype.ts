interface Array<T> {
	groupBy(this: T[], keyGetter: (item: T) => string): Map<string, T[]>;
}

Array.prototype.groupBy = groupBy;

function groupBy<T>(this: T[], keyGetter: (item: T) => string) {
	const map = new Map<string, T[]>();

	for (const item of this) {
		const key = keyGetter(item);
		const collection = map.get(key);

		if (!collection) {
			map.set(key, [item]);
		} else {
			collection.push(item);
		}
	}

	return map;
}