import { strToU8, Zip, ZipDeflate } from "fflate";

export class fflateZip {
	private _zipFile = new Zip();
	private _zipOut: Uint8Array[] = [];
	private _finalized = false;

	private _resolve!: (value: Blob | PromiseLike<Blob>) => void;
	private _reject!: (reason?: any) => void;
	private _zipBlobPromise: Promise<Blob> = new Promise<Blob>((res, rej) => {
		this._resolve = res;
		this._reject = rej;
	});

	public compressionLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined = 9;

	constructor() {
		this._zipFile.ondata = (err, dat, final) => {
			if (err) {
				this._reject(err);
				return;
			}

			this._zipOut.push(dat);
			if (final) {
				this._resolve(new Blob(this._zipOut, { type: "application/zip" }));
			}
		}
	}

	public add(name: string, data: string | Uint8Array | object): void {
		if (this._finalized) {
			throw new Error("Cannot add data after finalization");
		}

		let file = new ZipDeflate(name, { level: this.compressionLevel });

		let bytes: Uint8Array | undefined;

		switch (typeof data) {
			case "string":
				bytes = strToU8(data);
				break;
			case "object":
				if (data instanceof Uint8Array) {
					bytes = data;
				} else {
					bytes = strToU8(JSON.stringify(data));
				}
				break;
		}

		if (bytes) {
			this._zipFile.add(file);
			file.push(bytes, true);
		}
	}

	public finalize() {
		this._zipFile.end();
		this._finalized = true;
		return this._zipBlobPromise;
	}
}