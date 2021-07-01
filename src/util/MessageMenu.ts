import {
  Client,
  ClientEvents,
  Collection,
  DMChannel,
  EmojiIdentifierResolvable,
  Message,
  MessageEmbed,
  MessageReaction,
  NewsChannel,
  PartialMessage,
  PartialUser,
  TextChannel,
  User
} from 'discord.js';

export const MenuActions = {
  firstPage: async (menu: MessageMenu) => {
    await menu.setPage(0);
    return;
  },
  lastPage: async (menu: MessageMenu) => {
    await menu.setPage(menu.menu.pages.length);
    return;
  },
  nextPage: async (menu: MessageMenu) => {
    try {
      await menu.setPage(menu.index + 1);
      return;
    } catch (err) {
      return; // Prevent error on overflow
    }
  },
  previousPage: async (menu: MessageMenu) => {
    try {
      await menu.setPage(menu.index - 1);
      return;
    } catch (err) {
      return; // Prevent error on underflow
    }
  },
  deleteMessage: async (menu: MessageMenu) => {
    await Promise.all([
      (menu.message?.deletable ? menu.message.delete() : Promise.resolve()) as Promise<unknown>,
      (menu.originalMessage.deletable ? menu.originalMessage.delete() : Promise.resolve()) as Promise<unknown>,
    ]);
    return;
  },
} as const;

export type MenuAction = keyof typeof MenuActions | MenuActionFunction;
export type MenuActionFunction = (menu: MessageMenu) => unknown;

export type MenuPageResolvable = MessageEmbed | string | ((menu: MessageMenu) => MessageEmbed | string | Promise<MessageEmbed | string>);

export interface MenuContent {
  pages: MenuPageResolvable[];
  reactions: MenuReaction[];
  timeout?: number;
}

export type MessageReactionFilter = (reaction: MessageReaction, user: User) => boolean | Promise<boolean>;

export interface MenuReaction {
  reaction: EmojiIdentifierResolvable;
  filter: MessageReactionFilter;
  action: MenuAction;
}

export class MessageMenu {
  public client: Client;
  public channel: DMChannel | NewsChannel | TextChannel;
  public message?: Message;
  public timeout?: NodeJS.Timeout;
  /** Internal index, shouldn't be modified by outside code */
  protected _index: number;

  constructor(public originalMessage: Message, public menu: MenuContent) {
    this.channel = this.originalMessage.channel;
    this.client = this.channel.client;
    this._index = 0;
  }

  public async exec(): Promise<Message> {
    if (this.hasExecuted()) {
      throw new Error('Message Menu has been already executed');
    }
    this.message = await this.setContent(this.menu.pages[this.index]);
    for (const menuReaction of this.menu.reactions) {
      const client = this.client;
      const message = this.message as Message;
      await this.message.react(menuReaction.reaction);
      if (this.menu.timeout) {
        this.timeout =
          client.setTimeout(
            () => {
              client.removeListener('messageReactionAdd', callback);
              client.removeListener('messageDelete', onMessageDelete);
              client.removeListener('messageDeleteBulk', onMessageDeleteBulk);
              client.setMaxListeners(client.getMaxListeners() - 3);
              message.reactions.removeAll();
            },
            this.menu.timeout
          );
      }
      const timeout = this.timeout;
      const callback = this.generateReactionCallback(menuReaction, timeout);
      client.setMaxListeners(client.getMaxListeners() + 3);
      client.on('messageReactionAdd', callback);
      // eslint-disable-next-line no-inner-declarations
      function onMessageDelete(m: Message | PartialMessage) {
        if (m.id === message.id) {
          client.removeListener('messageReactionAdd', callback);
          client.removeListener('messageDelete', onMessageDelete);
          client.removeListener('messageDeleteBulk', onMessageDeleteBulk);
          client.setMaxListeners(client.getMaxListeners() - 3);
          if (timeout) client.clearTimeout(timeout);
        }
      }
      // eslint-disable-next-line no-inner-declarations
      function onMessageDeleteBulk(mc: Collection<string, Message | PartialMessage>) {
        mc.each(m => onMessageDelete(m));
      }

      client.on('messageDelete', onMessageDelete);
      client.on('messageDeleteBulk', onMessageDeleteBulk);
    }
    return this.message;
  }

  public async setPage(index: number): Promise<Message> {
    if (!this.hasExecuted()) {
      throw new Error('Menu hasn\'t been executed yet');
    }
    if (this.menu.pages.length - 1 < index || index < 0) {
      throw new RangeError('Menu index out of range: ' + index);
    }
    if (this.index === index) {
      return this.message as Message;
    }
    this._index = index;
    return this.setContent(this.menu.pages[this.index]);
  }

  private async setContent(content: MenuPageResolvable): Promise<Message> {
    let generatedContent = typeof content === 'function' ? content(this) : content;
    if (generatedContent instanceof Promise) {
      generatedContent = await generatedContent;
    }
    if (typeof this.message === 'undefined') {
      return await this.channel.send(generatedContent);
    } else {
      return await this.message.edit(generatedContent);
    }
  }

  private generateReactionCallback(m: MenuReaction, t?: NodeJS.Timeout): (...args: ClientEvents['messageReactionAdd']) => void {
    return async (r: MessageReaction, u: User | PartialUser) => {
      const [reaction, user] = await Promise.all([r.fetch(), u.fetch()]);
      let shouldExecute = m.filter(reaction, user);
      if (shouldExecute instanceof Promise) {
        shouldExecute = await shouldExecute;
      }

      if (shouldExecute) {
        t?.refresh(); // The refresh function resets the timer of the timeout
        reaction.users.remove(user.id);
        MessageMenu.resolveAction(m.action)(this);
      }
    }
  }

  public hasExecuted(): boolean {
    return typeof this.message !== 'undefined';
  }

  public get index(): number {
    return this._index;
  }

  private static resolveAction(action: MenuAction): MenuActionFunction {
    if (typeof action !== 'string') {
      return action;
    } else {
      return MenuActions[action];
    }
  }
}