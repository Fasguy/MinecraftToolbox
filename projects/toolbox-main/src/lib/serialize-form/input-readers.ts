import { TypeRegistry } from "./type-registry";

export class InputReaders extends TypeRegistry {
	constructor() {
		super();
		this.registerDefault((el: HTMLInputElement) => el.value);
		this.register("checkbox", (el: HTMLInputElement) => el.getAttribute("value") !== null ? (el.checked ? el.getAttribute("value") : null) : el.checked);
		this.register("select", (el: HTMLSelectElement) => getSelectValue(el));
	}
}

function getSelectValue(elem: HTMLSelectElement) {
	let single = elem.type === "select-one";
	let values: string[] | null = single ? null : [];

	for (const option of elem.options) {
		let parentNode = (<HTMLOptGroupElement>option.parentNode!);

		if ((option.selected) && !option.disabled && !(parentNode.tagName.toLowerCase() === "optgroup" && parentNode.disabled)) {
			if (single) {
				return option.value;
			}

			values!.push(option.value);
		}
	}

	return values;
}