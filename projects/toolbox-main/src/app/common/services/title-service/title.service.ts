import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class TitleService {
	public constructor(
		angularTitleService: Title,
		router: Router
	) {
		router.events
			.pipe(filter(x => x instanceof NavigationEnd))
			.subscribe(_ => {
				let routeData;

				do {
					routeData = router.routerState.root.firstChild?.snapshot?.data;
				} while (routeData && !routeData["title"]);

				if (routeData) {
					angularTitleService.setTitle(`Minecraft Toolbox - ${routeData["title"]}`);
				} else {
					angularTitleService.setTitle(`Minecraft Toolbox`);
				}
			});
	}
}