import { useState } from 'react';
import { ChevronDown, Plus, Layers, Trash2 } from 'lucide-react';
import SurfaceCard from './SurfaceCard';
import { sentenceCase } from './helpers';

interface Surface {
  [key: string]: any;
}

export interface Area {
  area_type?: string;
  display_name?: string;
  surfaces?: Surface[];
  [key: string]: any;
}

interface Props {
  areas: Area[];
  isEditing?: boolean;
  onAddArea?: () => void;
  onAddSurface?: (areaIndex: number) => void;
  onDeleteArea?: (areaIndex: number) => void;
  onDeleteSurface?: (areaIndex: number, surfaceIndex: number) => void;
  onChangeArea?: (areaIndex: number, field: 'area_type' | 'display_name', value: string) => void;
  onChangeSurface?: (
    areaIndex: number,
    surfaceIndex: number,
    field: 'surface_name' | 'surface_type' | 'width_cm' | 'height_cm' | 'opening_direction' | 'special_requirements',
    value: string
  ) => void;
  onUpdateSpec?: (areaIndex: number, surfaceIndex: number, specUpdates: any) => void;
  fabricTypes?: any[];
  models?: any[];
  items?: any[];
  motors?: any[];
  className?: string;
}

export default function AreaAccordion({
  areas,
  isEditing = false,
  onAddArea,
  onAddSurface,
  onDeleteArea,
  onDeleteSurface,
  className = '',
}: Props) {
  // All areas open by default for effortless overview, toggleable individually
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});

  const toggleArea = (idx: number) => {
    setOpenMap((prev) => ({
      ...prev,
      [idx]: prev[idx] !== undefined ? !prev[idx] : false, // initial state is open
    }));
  };

  const isAreaOpen = (idx: number) => {
    return openMap[idx] === undefined ? true : openMap[idx];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Areas & Surfaces</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {areas.length} {areas.length === 1 ? 'Area' : 'Areas'}
          </span>
        </div>

        {isEditing && onAddArea && (
          <button
            type="button"
            onClick={onAddArea}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2F5D8F] hover:bg-[#1B3A5E] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Area</span>
          </button>
        )}
      </div>

      {areas.length === 0 ? (
        <div className="qd-card text-center py-12">
          <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-600">No areas added to this quotation yet.</p>
          {isEditing && onAddArea && (
            <button
              type="button"
              onClick={onAddArea}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2F5D8F] text-white text-xs font-semibold shadow-sm hover:bg-[#1B3A5E]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Area</span>
            </button>
          )}
        </div>
      ) : (
        areas.map((area, areaIdx) => {
          const isOpen = isAreaOpen(areaIdx);
          const surfaces = area.surfaces || [];

          return (
            <div key={areaIdx} className="qd-card qd-area transition-all">
              {/* Accordion Header */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => toggleArea(areaIdx)}
                  className="qd-area-header flex-1"
                  aria-expanded={isOpen}
                >
                  <div className="qd-area-left">
                    <div className="qd-area-icon">
                      <Layers />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="qd-area-name">
                          {area.display_name || sentenceCase(area.area_type) || `Area ${areaIdx + 1}`}
                        </span>
                        {area.area_type && area.display_name && (
                          <span className="text-xs text-slate-400 font-normal">
                            ({sentenceCase(area.area_type)})
                          </span>
                        )}
                        <span className="qd-area-count">
                          {surfaces.length} {surfaces.length === 1 ? 'surface' : 'surfaces'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="qd-area-right">
                    <ChevronDown
                      className={`qd-area-chevron ${
                        isOpen ? 'qd-area-chevron--open' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Edit Controls for Area */}
                {isEditing && (
                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-100">
                    {onAddSurface && (
                      <button
                        type="button"
                        onClick={() => onAddSurface(areaIdx)}
                        className="p-1.5 rounded-lg text-[#2F5D8F] hover:bg-[#EEF4FA] transition-colors cursor-pointer"
                        title="Add Surface to Area"
                        aria-label="Add Surface to Area"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteArea && (
                      <button
                        type="button"
                        onClick={() => onDeleteArea(areaIdx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Area"
                        aria-label="Delete Area"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion Body */}
              <div
                className={`qd-area-body ${
                  isOpen ? 'qd-area-body--open' : ''
                }`}
              >
                <div className="qd-area-body-inner">
                  {surfaces.length === 0 ? (
                    <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500">No surfaces in this area.</p>
                      {isEditing && onAddSurface && (
                        <button
                          type="button"
                          onClick={() => onAddSurface(areaIdx)}
                          className="mt-2 text-xs font-semibold text-[#2F5D8F] hover:underline cursor-pointer"
                        >
                          + Add Surface
                        </button>
                      )}
                    </div>
                  ) : (
                    surfaces.map((surface, surfIdx) => (
                      <SurfaceCard
                        key={surfIdx}
                        surface={surface}
                        isEditing={isEditing}
                        onDelete={
                          onDeleteSurface
                            ? () => onDeleteSurface(areaIdx, surfIdx)
                            : undefined
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
