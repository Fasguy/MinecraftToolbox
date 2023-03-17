import { TypeRegistry } from "./type-registry";

export class KeyExtractors extends TypeRegistry {
	constructor() {
		super();
		this.registerDefault((el: HTMLElement) => (el.getAttribute("name") || ""));
	}
}