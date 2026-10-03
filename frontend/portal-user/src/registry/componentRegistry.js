import ButtonNode from "../components/nodes/ButtonNode/ButtonNode";
import TextNode from "../components/nodes/TextNode/TextNode";
import HeadingNode from "../components/nodes/HeadingNode/HeadingNode";
import InputNode from "../components/nodes/InputNode/InputNode";
import CardNode from "../components/nodes/CardNode/CardNode";
import ContainerNode from "../components/nodes/ContainerNode/ContainerNode";
import ImageNode from "../components/nodes/ImageNode/ImageNode";

/**
 * Registre des composants Blueprint.
 * 
 * Mappe chaque type de composant vers son composant React.
 * Interdit : if (type === ...) ou switch(type).
 * 
 * @type {Object.<string, React.ComponentType<import('./componentRegistry').NodeProps>>}
 */
const componentRegistry = {
  button: ButtonNode,
  text: TextNode,
  heading: HeadingNode,
  input: InputNode,
  card: CardNode,
  container: ContainerNode,
  image: ImageNode,
};

/**
 * Résout un composant depuis le registre.
 * @param {string} type
 * @returns {React.ComponentType | null}
 */
export function resolveComponent(type) {
  return componentRegistry[type] ?? null;
}

/**
 * Retourne tous les types de composants supportés.
 * @returns {string[]}
 */
export function getSupportedTypes() {
  return Object.keys(componentRegistry);
}

export default componentRegistry;
