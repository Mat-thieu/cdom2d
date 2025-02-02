export type NodeRegistrar = (classType: new (...args: any[]) => any, classArgs: any, children?: any[]) => any;

export default class Component {
  constructor(
    treeConstruct: string | ((nodeRegistrar: NodeRegistrar) => void)
  ) {
    if (typeof treeConstruct === 'string') {
      console.log({ treeConstruct });
      return;
    }
    const nodeRegistrar: NodeRegistrar = (classType: new (...args: any[]) => any, classArgs: any, children?: any) => {
      console.log(`register ${classType.name} with instance, children length: ${children?.length} args`, classArgs);
    }
    treeConstruct(nodeRegistrar);
  }
}