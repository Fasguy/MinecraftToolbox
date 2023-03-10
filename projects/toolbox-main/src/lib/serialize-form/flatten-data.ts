import { Collection } from ".";
import { keyJoiner } from "./key-joiner";

export function flattenData(data: Collection, parentKey: string | null) {
	let flatData: Collection = {};

	for (let keyName in data) {
		if (!data.hasOwnProperty(keyName)) {
			continue;
		}

		let value: Collection = data[keyName];
		let hash: Collection = {};

		// If there is a parent key, join it with
		// the current, child key.
		if (parentKey) {
			keyName = keyJoiner(parentKey, keyName);
		}

		if (Array.isArray(value)) {
			hash[keyName + "[]"] = value;
			hash[keyName] = value;
		} else if (typeof value === "object") {
			hash = flattenData(value, keyName);
		} else {
			hash[keyName] = value;
		}

		Object.assign(flatData, hash);
	}

	return flatData;
}