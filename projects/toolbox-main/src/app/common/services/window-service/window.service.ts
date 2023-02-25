import { Injectable, Type, ViewContainerRef } from "@angular/core";
import { IWindow, WindowComponent } from "../../views/window/window.component";

@Injectable({
	providedIn: "root"
})
export class WindowService {
	public windowContainer!: ViewContainerRef;

	public createWindow<TWindow extends IWindow>(childComponent: Type<TWindow>) {
		let componentRef = this.windowContainer.createComponent(WindowComponent<TWindow>);
		componentRef.instance.selfRef = componentRef;
		componentRef.instance.createChildComponent(childComponent);
	}
}