export function getInputElements(element: HTMLElement) {
	return Array.prototype.filter.call(
		element.querySelectorAll("input,select,textarea"),
		(el: HTMLInputElement) => !(el.tagName.toLowerCase() === "input" && (el.type === "submit" || el.type === "reset" || el.dataset["presetIgnore"] !== undefined))
	);
}