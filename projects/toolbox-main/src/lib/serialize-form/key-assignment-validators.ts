import { TypeRegistry } from "./type-registry";

export class KeyAssignmentValidators extends TypeRegistry {
	constructor() {
		super();
		this.registerDefault(() => true);
		this.register("radio", (el: any) => el.checked);
	}
}