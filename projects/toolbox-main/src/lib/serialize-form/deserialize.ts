import { Collection } from "."
import { flattenData } from "./flatten-data"
import { getElementType } from "./get-element-type"
import { getInputElements } from "./get-input-elements"
import { InputWriters } from "./input-writers"
import { KeyExtractors } from "./key-extractors"

export function deserialize(form: HTMLFormElement, data: Collection) {
	let flattenedData: Collection = flattenData(data, null);
	let keyExtractors = new KeyExtractors();
	let inputWriters = new InputWriters();

	for (const el of getInputElements(form)) {
		let type = getElementType(el);

		let keyExtractor = keyExtractors.get(type);
		let key = keyExtractor(el);

		let inputWriter = inputWriters.get(type);
		let value = flattenedData[key];

		inputWriter(el, value);
	}
}