import { ConfigSpec } from "../util/ConfigSpec";
import { Vesalius } from "./Vesalius";

export interface BaseConfig { }

export abstract class Base {
  constructor(public id: string, public client: Vesalius) { }

  public buildConfigSpec(spec: ConfigSpec): void { }

  public load(config: BaseConfig) { }

  public abstract exec(...args: any[]): any;
}