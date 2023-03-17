import { TypeRegistry } from "./type-registry";

export class InputWriters extends TypeRegistry {
	constructor() {
		super();
		this.registerDefault((el: HTMLInputElement, value: any) => { el.value = value });
		this.register("checkbox", (el: HTMLInputElement, value: any) => {
			if (value === null) {
				el.indeterminate = true;
			} else {
				el.checked = Array.isArray(value) ? value.indexOf(el.value) !== -1 : value;
			}

			el.dispatchEvent(new Event("change"));
		});
		this.register("radio", function (el: HTMLInputElement, value: any) {
			if (value !== undefined) {
				el.checked = el.value === value.toString();
			}
		});
		this.register("select", setSelectValue);
	}
}

function makeArray(arr: any) {
	let ret: any[] = [];
	if (arr !== null) {
		if (Array.isArray(arr)) {
			ret.push.apply(ret, arr);
		} else {
			ret.push(arr);
		}
	}
	return ret;
}

function setSelectValue(elem: HTMLSelectElement, value: string | string[]) {
	let optionSet, option
	let options = elem.options
	let values = makeArray(value)
	let i = options.length

	while (i--) {
		option = options[i]
		if (values.indexOf(option.value) > -1) {
			option.setAttribute("selected", "true")
			optionSet = true
		}
	}

	// Force browsers to behave consistently when non-matching value is set
	if (!optionSet) {
		elem.selectedIndex = -1
	}
}