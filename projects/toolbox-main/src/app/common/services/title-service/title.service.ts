import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Injectable({
	providedIn: 'root'
})
export class TitleService {
	constructor(
		private titleService: Title
	) {
	}

	public getTitle() {
		return this.titleService.getTitle();
	}

	public setTitle(newTitle: string) {
		this.titleService.setTitle(`Minecraft Toolbox - ${newTitle}`);
	}
}