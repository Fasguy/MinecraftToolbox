export function keyJoiner(parentKey: string, childKey: string) {
	return `${parentKey}[${childKey}]`;
}