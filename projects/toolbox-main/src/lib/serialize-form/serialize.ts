import { assignKeyValue } from "./assign-key-value"
import { getElementType } from "./get-element-type"
import { getInputElements } from "./get-input-elements"
import { InputReaders } from "./input-readers"
import { KeyAssignmentValidators } from "./key-assignment-validators"
import { KeyExtractors } from "./key-extractors"
import { keySplitter } from "./key-splitter"

export function serialize(element: any) {
	let data = {};
	let keyExtractors = new KeyExtractors();
	let inputReaders = new InputReaders();
	let keyAssignmentValidators = new KeyAssignmentValidators();

	for (const inputElement of getInputElements(element)) {
		let type = getElementType(inputElement);
		let keyExtractor = keyExtractors.get(type);
		let key = keyExtractor(inputElement);
		let inputReader = inputReaders.get(type);
		let value = inputReader(inputElement);
		let validKeyAssignment = keyAssignmentValidators.get(type);
		if (validKeyAssignment(inputElement, key, value)) {
			let keychain = keySplitter(key);
			data = assignKeyValue(data, keychain, value);
		}
	}

	return data;
}