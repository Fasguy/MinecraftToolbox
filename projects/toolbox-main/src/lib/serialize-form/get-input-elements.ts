export function getInputElements(element: HTMLElement) {
	return Array.prototype.filter.call(
		element.querySelectorAll("input,select,textarea"),
		(el) => !(el.tagName.toLowerCase() === "input" && (el.type === "submit" || el.type === "reset"))
	);
}