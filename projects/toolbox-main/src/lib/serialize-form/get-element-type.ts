export function getElementType(el: HTMLElement) {
	let type = el.tagName;
	if (type.toLowerCase() === "input") {
		let typeAttr = el.getAttribute("type");
		if (typeAttr) {
			type = typeAttr;
		} else {
			type = "text";
		}
	}

	return type.toLowerCase();
}