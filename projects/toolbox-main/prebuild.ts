import { readFileSync, writeFileSync } from 'fs';

(() => {
	const packageJson = require('../../package.json');

	const changelogFile = "./projects/toolbox-main/src/resources/data/changelog.json";
	const changelog = <any[]>JSON.parse(readFileSync(changelogFile, { encoding: "utf-8" }));

	const previousEntry = changelog[changelog.length - 2];
	const currentEntry = changelog[changelog.length - 1];

	if (currentEntry.version || currentEntry.build_date) {
		console.error("A unset entry must be present in the changelog.");
		process.exit(-1);
	}

	if (packageJson.version === previousEntry.version) {
		console.error("The version in package.json must be updated before building.");
		process.exit(-1);
	}

	currentEntry.version = packageJson.version;
	currentEntry.build_date = new Date().toISOString().split('T')[0];

	writeFileSync(changelogFile, JSON.stringify(changelog, undefined, "\t"));

	console.log(`Building Minecraft Toolbox v${packageJson.version}...`);
})();