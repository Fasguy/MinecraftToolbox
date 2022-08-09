import { Component, OnInit } from '@angular/core';
import changelogJson from "../../../../../resources/data/changelog.json";

@Component({
	templateUrl: './changelog.component.html',
	styleUrls: ['./changelog.component.scss']
})
export class ChangelogComponent implements OnInit {

	public changelog!: ChangelogEntry[];

	constructor() { }

	ngOnInit(): void {
		this.changelog = changelogJson;
	}
}

export interface Changes {
	additions: string[];
	modifications: string[];
	removals: string[];
}

export interface ChangelogEntry {
	version: string;
	build_date: string;
	changes: Changes;
	notes: string;
}