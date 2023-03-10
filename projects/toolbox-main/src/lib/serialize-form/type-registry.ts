export class TypeRegistry {
	private registeredTypes: { [key: string]: Function } = {};

	get(type: string) {
		if (typeof this.registeredTypes[type] !== "undefined") {
			return this.registeredTypes[type];
		} else {
			return this.registeredTypes["default"];
		}
	}

	register(type: string, item: Function) {
		if (typeof this.registeredTypes[type] === "undefined") {
			this.registeredTypes[type] = item;
		}
	}

	registerDefault(item: Function) {
		this.register("default", item);
	}
}