import { useContext } from "react";
import DataListRow from "@/components/DataListRow";
import { PublicMapContext } from "../PublicMapContext";
import EditablePublicMapProperty from "./EditablePublicMapProperty";

export default function EditorInfoSettings() {
  const { publicMap } = useContext(PublicMapContext);
  const sectionStyles = "flex flex-col gap-2 ";
  const mapTitle = publicMap?.name;
  const mapDescription = publicMap?.description;
  const mapDescriptionLink = publicMap?.descriptionLink;
  return (
    <div className={sectionStyles}>
      <DataListRow label="Public Map Title" orientation="vertical">
        <EditablePublicMapProperty property="name" placeholder="Map Title">
          {mapTitle}
        </EditablePublicMapProperty>
      </DataListRow>
      <DataListRow label="Public Map Description" orientation="vertical">
        <EditablePublicMapProperty
          property="description"
          placeholder="Map Description"
        >
          {mapDescription}
        </EditablePublicMapProperty>
      </DataListRow>
      <DataListRow label="Map Description Link" orientation="vertical">
        <EditablePublicMapProperty
          property="descriptionLink"
          placeholder="Map Description Link"
        >
          {mapDescriptionLink}
        </EditablePublicMapProperty>
      </DataListRow>
    </div>
  );
}
