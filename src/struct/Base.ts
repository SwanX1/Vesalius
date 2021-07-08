import { ConfigSpec } from "../util/ConfigSpec";
import { Vesalius } from "./Vesalius";

export interface BaseConfig { }

export interface HasConfig {
  buildConfigSpec(spec: ConfigSpec): void;
  load(config: BaseConfig): void;
}

export abstract class Base implements HasConfig {
  constructor(public id: string, public client: Vesalius) { }

  public buildConfigSpec(spec: ConfigSpec): void { }

  public load(config: BaseConfig): void { }

  public abstract exec(...args: any[]): any;
}