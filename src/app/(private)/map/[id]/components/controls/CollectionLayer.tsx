import { Table } from 'lucide-react'
import React from 'react'
import DataSourceIcon from '../DataSourceIcon'
import CollectionIcon from '../Icons'
import { mapColors } from '@/app/(private)/map/[id]/styles'
import { GoogleSheetsIconSVG, MailchimpIconSVG } from '../DataSourceIcon'

export default function CollectionLayer({ dataSource, isSelected, onClick, handleDataSourceSelect, layerType }: { dataSource: any, isSelected: boolean, onClick: () => void, handleDataSourceSelect: (id: string) => void, layerType: string }) {
    const layerColor = layerType === 'member' ? mapColors.member.color : mapColors.markers.color;

    return (
        <div
            className={`text-sm cursor-pointer border border-neutral-200 p-2 rounded-sm hover:bg-neutral-100 transition-colors flex items-center justify-between gap-2 ${isSelected ? "bg-neutral-100" : ""
                }`}
            onClick={() => handleDataSourceSelect(dataSource.id)}
        >
            <div className="flex items-center gap-2">
                <CollectionIcon
                    color={layerColor}
                />
                {dataSource.name}
                <DataSourceIcon type={dataSource.config.type} />
            </div>
            {isSelected && <Table className="w-4 h-4 text-neutral-500" />}
        </div>

    )
}