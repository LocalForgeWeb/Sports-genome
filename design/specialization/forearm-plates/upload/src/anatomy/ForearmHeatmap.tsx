import { useEffect, useMemo, useRef, useState } from 'react';
import { manifestById } from './muscleManifest';
import type { MuscleData, MuscleId, Side } from './types';

type Metric = 'volume' | 'target';
type LayerMode = 'surface' | 'deep';
type PlateKey =
  | 'anterior-surface'
  | 'posterior-surface'
  | 'lateral-surface'
  | 'anterior-deep'
  | 'posterior-deep'
  | 'lateral-deep';

interface ForearmHeatmapProps {
  selectedMuscleId: MuscleId | null;
  muscleDataById: Record<string, MuscleData>;
  side: Side;
  onMuscleSelect: (muscleId: MuscleId) => void;
}

interface PlateDefinition {
  key: PlateKey;
  label: string;
  note: string;
  muscles: MuscleId[];
}

const ASSET_ROOT = '/assets/anatomy/mesh-plates';
const HEAT_LOW = '#27566f';
const HEAT_MID = '#d9803c';
const HEAT_HIGH = '#f15a32';

const PLATES: Record<LayerMode, PlateDefinition[]> = {
  surface: [
    {
      key: 'anterior-surface',
      label: 'Front / palmar',
      note: 'surface + intermediate flexors',
      muscles: [
        'brachioradialis', 'flexor-digitorum-superficialis', 'flexor-carpi-ulnaris',
        'flexor-carpi-radialis', 'palmaris-longus', 'pronator-teres',
      ],
    },
    {
      key: 'posterior-surface',
      label: 'Back / dorsal',
      note: 'surface extensors',
      muscles: [
        'brachioradialis', 'anconeus', 'extensor-digitorum',
        'extensor-carpi-radialis-brevis', 'extensor-carpi-radialis-longus',
        'extensor-carpi-ulnaris', 'extensor-digiti-minimi',
      ],
    },
    {
      key: 'lateral-surface',
      label: 'Side / thumb',
      note: 'radial contour + wrist extensors',
      muscles: [
        'brachioradialis', 'flexor-carpi-radialis',
        'extensor-carpi-radialis-longus', 'extensor-carpi-radialis-brevis',
      ],
    },
  ],
  deep: [
    {
      key: 'anterior-deep',
      label: 'Front / palmar',
      note: 'deep flexor layer',
      muscles: ['flexor-digitorum-profundus', 'flexor-pollicis-longus', 'pronator-quadratus'],
    },
    {
      key: 'posterior-deep',
      label: 'Back / dorsal',
      note: 'deep thumb + index layer',
      muscles: ['supinator', 'abductor-pollicis-longus', 'extensor-pollicis-brevis', 'extensor-pollicis-longus', 'extensor-indicis'],
    },
    {
      key: 'lateral-deep',
      label: 'Side / thumb',
      note: 'deep radial + thumb structures',
      muscles: [
        'supinator', 'flexor-pollicis-longus', 'abductor-pollicis-longus',
        'extensor-pollicis-brevis', 'extensor-pollicis-longus',
      ],
    },
  ],
};

const PASS_BY_MUSCLE = Object.fromEntries(
  (Object.keys(PLATES) as LayerMode[]).flatMap((mode) =>
    PLATES[mode].flatMap((plate) => plate.muscles.map((id) => [id, mode])),
  ),
) as Record<MuscleId, LayerMode>;

function mixHex(from: string, to: string, amount: number) {
  const fromRgb = from.replace('#', '').match(/.{2}/g)?.map((value) => Number.parseInt(value, 16)) ?? [0, 0, 0];
  const toRgb = to.replace('#', '').match(/.{2}/g)?.map((value) => Number.parseInt(value, 16)) ?? [0, 0, 0];
  const mixed = fromRgb.map((value, index) => Math.round(value + (toRgb[index] - value) * amount));
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function heatColor(value: number, maximum: number) {
  if (maximum <= 0 || value <= 0) return HEAT_LOW;
  const normalized = Math.min(value / maximum, 1);
  return normalized < 0.5
    ? mixHex(HEAT_LOW, HEAT_MID, normalized * 2)
    : mixHex(HEAT_MID, HEAT_HIGH, (normalized - 0.5) * 2);
}

function metricValue(data: MuscleData | undefined, metric: Metric) {
  return metric === 'volume' ? data?.directDynamicSets ?? 0 : data?.targetSets ?? 0;
}

function metricLabel(metric: Metric) {
  return metric === 'volume' ? 'direct sets' : 'target sets';
}

function anatomyIdLabel(id: MuscleId | null | undefined) {
  const entry = id ? manifestById[id] : undefined;
  return entry ? `F${entry.catalogNumber.toString().padStart(2, '0')}` : '—';
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${source}`));
    image.src = source;
  });
}

function tintMask(mask: HTMLImageElement, color: string) {
  const layer = document.createElement('canvas');
  layer.width = mask.naturalWidth;
  layer.height = mask.naturalHeight;
  const context = layer.getContext('2d');
  if (!context) return layer;
  context.drawImage(mask, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = color;
  context.fillRect(0, 0, layer.width, layer.height);
  return layer;
}

interface MeshPlateProps {
  plate: PlateDefinition;
  metric: Metric;
  maximum: number;
  selectedMuscleId: MuscleId | null;
  muscleDataById: Record<string, MuscleData>;
  side: Side;
  onMuscleSelect: (id: MuscleId) => void;
  onHover: (id: MuscleId | null) => void;
}

function MeshPlate({
  plate,
  metric,
  maximum,
  selectedMuscleId,
  muscleDataById,
  side,
  onMuscleSelect,
  onHover,
}: MeshPlateProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskPixelsRef = useRef<Record<string, ImageData>>({});
  const [assets, setAssets] = useState<{ base: HTMLImageElement; masks: Record<string, HTMLImageElement> } | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAssets(null);
    setAssetError(null);
    const basePath = `${ASSET_ROOT}/${plate.key}.png`;
    const maskRequests = plate.muscles.map(async (id) => [id, await loadImage(`${ASSET_ROOT}/${plate.key}__${id}.png`)] as const);
    Promise.all([loadImage(basePath), ...maskRequests])
      .then(([base, ...maskEntries]) => {
        if (cancelled) return;
        setAssets({ base, masks: Object.fromEntries(maskEntries) });
      })
      .catch((error: unknown) => {
        if (!cancelled) setAssetError(error instanceof Error ? error.message : 'The rendered anatomy assets could not load.');
      });
    return () => {
      cancelled = true;
    };
  }, [plate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !assets) return;
    canvas.width = assets.base.naturalWidth;
    canvas.height = assets.base.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(assets.base, 0, 0);
    const masks: Record<string, ImageData> = {};

    plate.muscles.forEach((id) => {
      const mask = assets.masks[id];
      if (!mask) return;
      const value = metricValue(muscleDataById[id], metric);
      const selected = id === selectedMuscleId;
      const heat = tintMask(mask, heatColor(value, maximum));
      const alpha = selected ? 0.82 : Math.max(0.10, Math.min(0.48, 0.12 + (value / maximum) * 0.36));
      context.save();
      context.globalAlpha = alpha;
      if (selected) {
        context.shadowColor = 'rgba(255, 213, 188, .86)';
        context.shadowBlur = 18;
      }
      context.drawImage(heat, 0, 0);
      context.restore();

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
      if (maskContext) {
        maskContext.drawImage(mask, 0, 0);
        masks[id] = maskContext.getImageData(0, 0, canvas.width, canvas.height);
      }
    });
    maskPixelsRef.current = masks;
  }, [assets, maximum, metric, muscleDataById, plate, selectedMuscleId]);

  const muscleAtPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = Math.max(0, Math.min(canvas.width - 1, Math.floor((clientX - rect.left) * scaleX)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((clientY - rect.top) * scaleY)));
    if (side === 'left') x = canvas.width - 1 - x;
    const offset = (y * canvas.width + x) * 4 + 3;
    const candidate = [...plate.muscles].reverse().find((id) => (maskPixelsRef.current[id]?.data[offset] ?? 0) > 42);
    return candidate ?? null;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const id = muscleAtPoint(event.clientX, event.clientY);
    onHover(id);
    event.currentTarget.style.cursor = id ? 'pointer' : 'default';
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const id = muscleAtPoint(event.clientX, event.clientY);
    if (id) onMuscleSelect(id);
  };

  return (
    <figure className="mesh-plate" data-selected={plate.muscles.includes(selectedMuscleId ?? '') ? 'true' : 'false'}>
      <figcaption>
        <span>{plate.label}</span>
        <small>{plate.note}</small>
      </figcaption>
      <div className={`mesh-plate-canvas-frame ${side === 'left' ? 'is-left' : ''}`}>
        <canvas
          ref={canvasRef}
          className="mesh-plate-canvas"
          aria-label={`${plate.label} model-derived anatomy plate. Click a tinted muscle to select it.`}
          role="button"
          tabIndex={0}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => onHover(null)}
          onClick={handleClick}
        />
        {!assets && !assetError && <span className="mesh-plate-loading">Preparing exact muscle map…</span>}
        {assetError && <span className="mesh-plate-error">{assetError}</span>}
      </div>
    </figure>
  );
}

export function ForearmHeatmap({ selectedMuscleId, muscleDataById, side, onMuscleSelect }: ForearmHeatmapProps) {
  const [metric, setMetric] = useState<Metric>('volume');
  const [layer, setLayer] = useState<LayerMode>('surface');
  const [hoveredMuscleId, setHoveredMuscleId] = useState<MuscleId | null>(null);

  const entries = useMemo(
    () => Object.values(muscleDataById).sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [muscleDataById],
  );
  const maximum = useMemo(() => Math.max(1, ...entries.map((data) => metricValue(data, metric))), [entries, metric]);
  const readingId = hoveredMuscleId ?? selectedMuscleId;
  const readingData = readingId ? muscleDataById[readingId] : undefined;
  const readingManifest = readingId ? manifestById[readingId] : undefined;
  const readingName = readingData?.displayName ?? (readingId ? manifestById[readingId]?.displayName : 'Choose a muscle');
  const readingValue = metricValue(readingData, metric);

  useEffect(() => {
    if (selectedMuscleId) setLayer(PASS_BY_MUSCLE[selectedMuscleId] ?? 'surface');
  }, [selectedMuscleId]);

  return (
    <div className="forearm-heatmap mesh-heatmap" data-layer={layer}>
      <div className="heatmap-controlbar" aria-label="Forearm heatmap controls">
        <div className="heatmap-control-title">
          <span className="micro-label">Exact muscle map</span>
          <strong>Model-derived heat plates</strong>
        </div>
        <div className="heatmap-mode-toggle" role="group" aria-label="Anatomical layer">
          {(['surface', 'deep'] as LayerMode[]).map((value) => (
            <button className={layer === value ? 'is-active' : ''} type="button" key={value} onClick={() => setLayer(value)} aria-pressed={layer === value}>
              {value === 'surface' ? 'Surface' : 'Deep'}
            </button>
          ))}
        </div>
        <div className="heatmap-segments" role="group" aria-label="Heatmap metric">
          {(['volume', 'target'] as Metric[]).map((value) => (
            <button className={metric === value ? 'is-active' : ''} type="button" key={value} onClick={() => setMetric(value)} aria-pressed={metric === value}>
              {value === 'volume' ? 'Volume' : 'Target'}
            </button>
          ))}
        </div>
      </div>

      <div className="heatmap-reading" aria-live="polite">
        <span className="heatmap-reading-label">{hoveredMuscleId ? 'Inspecting' : selectedMuscleId ? 'Selected' : 'Heatmap input'}</span>
        <span className="heatmap-reading-catalog">{readingId ? `Anatomy ID ${anatomyIdLabel(readingId)} · ${readingManifest?.anatomyTag}` : 'Select a tagged structure'}</span>
        <strong>{readingName}</strong>
        <span>{readingId ? `${readingValue} ${metricLabel(metric)}` : `0 — ${maximum} ${metricLabel(metric)}`}</span>
        <span className="heatmap-focus-hint">Click the rendered muscle · {side} side</span>
      </div>

      <div className="mesh-plate-views" aria-label={`${layer} layer mesh-derived forearm plates`}>
        {PLATES[layer].map((plate) => (
          <MeshPlate
            key={plate.key}
            plate={plate}
            metric={metric}
            maximum={maximum}
            selectedMuscleId={selectedMuscleId}
            muscleDataById={muscleDataById}
            side={side}
            onMuscleSelect={onMuscleSelect}
            onHover={setHoveredMuscleId}
          />
        ))}
      </div>

      <section className="mesh-heat-key" aria-label={`Exact muscle heat key, zero to ${maximum} ${metricLabel(metric)}`}>
        <div className="reference-heat-key-heading">
          <div>
            <span className="micro-label">Exact alpha-mask heat key</span>
            <strong>Every value colors its own mesh</strong>
          </div>
          <p>0 <span>→</span> {maximum} {metricLabel(metric)}</p>
        </div>
        <div className="reference-heat-grid" role="list">
          {entries.map((data) => {
            const id = data.id as MuscleId;
            const anatomy = manifestById[id];
            const value = metricValue(data, metric);
            const selected = id === selectedMuscleId;
            return (
              <button
                key={id}
                className={`reference-heat-cell ${selected ? 'is-selected' : ''}`}
                type="button"
                role="listitem"
                style={{ borderLeftColor: heatColor(value, maximum) }}
                onClick={() => onMuscleSelect(id)}
                onFocus={() => setHoveredMuscleId(id)}
                onBlur={() => setHoveredMuscleId(null)}
                onMouseEnter={() => setHoveredMuscleId(id)}
                onMouseLeave={() => setHoveredMuscleId(null)}
                aria-pressed={selected}
                aria-label={`Anatomy ID ${anatomyIdLabel(id)}. ${data.displayName}. ${anatomy?.anatomyTag ?? 'mapped muscle'}. ${value} ${metricLabel(metric)}.`}
              >
                <span className="reference-heat-cell-name"><b>{anatomyIdLabel(id)}</b><span>{data.displayName}</span></span>
                <strong style={{ color: heatColor(value, maximum) }}>{value}</strong>
                <small className="reference-heat-cell-tag">{anatomy?.anatomyTag ?? 'mapped muscle'} · {metricLabel(metric)}</small>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
