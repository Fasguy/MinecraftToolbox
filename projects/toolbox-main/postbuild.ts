import { promises, readFileSync, writeFile } from 'fs';
import { extname, resolve } from 'path';

async function getFiles(dir: string): Promise<string[]> {
	const dirents = await promises.readdir(dir, { withFileTypes: true });
	const files = await Promise.all(dirents.map((dirent) => {
		const res = resolve(dir, dirent.name);
		return dirent.isDirectory() ? getFiles(res) : res;
	}));
	return Array.prototype.concat(...files);
}

(async () => {
	for (const f of (await getFiles('./projects/toolbox-main/dist/resources')).filter(x => extname(x) === '.json')) {
		console.log("Minifying", f);
		let jsonContent = readFileSync(f, { encoding: "utf-8" });
		writeFile(f, JSON.stringify(JSON.parse(jsonContent)), (err) => {
			if (err)
				return console.log(err);
		});
	}
})();