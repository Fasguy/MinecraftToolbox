import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
	name: "reverse"
})
export class ReversePipe implements PipeTransform {
	transform<TArray>(value: TArray[]): TArray[] {
		return [...value].reverse();
	}
}