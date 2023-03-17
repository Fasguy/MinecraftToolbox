import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { CRR_DatapackPreparerComponent } from "./crafting-recipe-randomizer/datapack-preparer/datapack-preparer.component";
import { LTR_DatapackPreparerComponent } from "./loot-table-randomizer/datapack-preparer/datapack-preparer.component";
import { PanoramaGeneratorComponent } from "./panorama-generator/panorama-generator.component";
import { SafeLinkPipe } from "./pipes/safe-link/safe-link.pipe";

@NgModule({
	declarations: [
		AppComponent,
		LTR_DatapackPreparerComponent,
		CRR_DatapackPreparerComponent,
		SafeLinkPipe,
		PanoramaGeneratorComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }