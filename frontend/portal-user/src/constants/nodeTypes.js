import TextNode from "../components/componentsNodes/TextNode";
import { ButtonNode } from "../components/componentsNodes/ButtonNode";
import { InputNode } from "../components/componentsNodes/InputNode";
import { ImageNode } from "../components/componentsNodes/ImageNode";
import { ContainerNode } from "../components/componentsNodes/ContainerNode";
import { ListNode } from "../components/componentsNodes/ListNode";
import { HeadingNode } from "../components/componentsNodes/HeadingNode";
import { CardNode } from "../components/componentsNodes/CardNode";
import { NavNode } from "../components/componentsNodes/NavNode";
import { FormNode } from "../components/componentsNodes/FormNode";

export const nodeTypes = {
    textNode: TextNode,
    buttonNode: ButtonNode,
    inputNode: InputNode,
    imageNode: ImageNode,
    containerNode: ContainerNode,
    listNode: ListNode,
    headingNode: HeadingNode,
    cardNode: CardNode,
    navNode: NavNode,
    formNode: FormNode
};
