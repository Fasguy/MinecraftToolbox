import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VersionSelectorViewComponent } from './common/views/version-selector/version-selector.component';
import { CraftingRecipeRandomizerViewComponent } from './crafting-recipe-randomizer/views/crafting-recipe-randomizer-view/crafting-recipe-randomizer-view.component';
import { InfoTabViewComponent } from './info-tab/views/info-tab-view/info-tab-view.component';
import { LootTableRandomizerViewComponent } from './loot-table-randomizer/views/loot-table-randomizer-view/loot-table-randomizer-view.component';

const routes: Routes = [
	{
		path: 'info',
		component: InfoTabViewComponent,
		children: [],
		data: {
			title: "Info"
		}
	},
	{
		path: 'loot-table-randomizer',
		children: [
			{
				path: '',
				component: VersionSelectorViewComponent,
				data: {
					versionInfo: "resources/loot-table-randomizer/data/versions.json",
				}
			},
			{
				path: ':version',
				component: LootTableRandomizerViewComponent
			},
		],
		data: {
			title: "Loot-Table Randomizer"
		}
	},
	{
		path: 'crafting-recipe-randomizer',
		children: [
			{
				path: '',
				component: VersionSelectorViewComponent,
				data: {
					versionInfo: "resources/crafting-recipe-randomizer/data/versions.json",
				}
			},
			{
				path: ':version',
				component: CraftingRecipeRandomizerViewComponent
			},
		],
		data: {
			title: "Crafting-Recipe Randomizer"
		}
	},
	{
		path: '**',
		redirectTo: 'info'
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}