import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as fabric from "fabric";
import axios from "axios";
import { API_BASE } from "../utils/api";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import MugWrapPreview from "../components/MugWrapPreview";
import {
  Layout,
  Card,
  Button,
  Typography,
  Space,
  Tag,
  InputNumber,
} from "antd";
import {
  FaTimes,
  FaArrowLeft,
  FaPlus,
  FaMinus,
  FaChevronLeft,
  FaChevronRight,
  FaImage,
  FaFont,
} from "react-icons/fa";
// customizationAPI no longer needed – frontend clipPath approach is used

const { Content } = Layout;
const { Title, Text } = Typography;

const CustomizeProduct = () => {
  const { id } = useParams();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorBgInputRef = useRef(null);
  const initialPlaceholdersRef = useRef({});
  const [canvas, setCanvas] = useState(null);
  const [template, setTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState("image");
  const [selectedObject, setSelectedObject] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  // Mug/cylindrical wrap preview
  const [mugPreviewUrl, setMugPreviewUrl] = useState(null); // flat design URL for mug warp render
  const [showMugPreview, setShowMugPreview] = useState(false); // toggle the 3D preview panel
  const [activeUploadSlot, setActiveUploadSlot] = useState(null); // Tracks center/left/right for explicit uploads
  const [customizationMode, setCustomizationMode] = useState(
    "singlePhotoBothSides",
  );
  const [photoTextValue, setPhotoTextValue] = useState("");
  const [photoSide, setPhotoSide] = useState("left");
  const [textSide, setTextSide] = useState("right");
  const [editorSide, setEditorSide] = useState("center");
  const [selectedUploadShape, setSelectedUploadShape] = useState("auto");
  const [uploadShapeBySlot, setUploadShapeBySlot] = useState({
    left: "auto",
    center: "auto",
    right: "auto",
  });
  const [shapeTargetSlot, setShapeTargetSlot] = useState("center");
  const [slotShapeOverrides, setSlotShapeOverrides] = useState({});
  const [slotAssets, setSlotAssets] = useState({
    left: { imageUrl: null, text: "", shapeType: null, transform: null },
    center: { imageUrl: null, text: "", shapeType: null, transform: null },
    right: { imageUrl: null, text: "", shapeType: null, transform: null },
    front: { imageUrl: null, text: "", shapeType: null, transform: null },
    back: { imageUrl: null, text: "", shapeType: null, transform: null },
  });

  const { user } = useAuth();
  const { addToCart, setSelectedItemIds, buyNowItem, setBuyNowItem } =
    useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(
    buyNowItem?.template?._id === id ? buyNowItem.quantity : 1,
  );
  const isWrapProduct = (() => {
    const catLower = (template?.category || "").toLowerCase();
    return (
      catLower.includes("mug") ||
      catLower.includes("sipper") ||
      catLower.includes("bottle") ||
      catLower.includes("planter") ||
      catLower.includes("case") ||
      template?.wrapType === "mug" ||
      template?.wrapType === "bottle" ||
      template?.wrapType === "planter" ||
      template?.wrapType === "phone"
    );
  })();
  const isStrictWrapShapeCategory = (() => {
    const catLower = (template?.category || "").toLowerCase();
    return (
      catLower.includes("mug") ||
      catLower.includes("sipper") ||
      catLower.includes("bottle") ||
      catLower.includes("planter") ||
      template?.wrapType === "mug" ||
      template?.wrapType === "bottle" ||
      template?.wrapType === "planter"
    );
  })();
  // ── New flat product category detectors ──────────────────────────────
  const catLowerGlobal = (template?.category || "").toLowerCase();
  const isKeychain = catLowerGlobal.includes("keychain");
  const isCoaster = catLowerGlobal.includes("coaster");
  const isFridgeMagnet =
    catLowerGlobal.includes("fridge") || catLowerGlobal.includes("magnet");
  const isIronOnSticker =
    catLowerGlobal.includes("iron") || catLowerGlobal.includes("sticker");
  const isFlatProduct =
    isKeychain || isCoaster || isFridgeMagnet || isIronOnSticker;

  const editorSides = isStrictWrapShapeCategory
    ? ["left", "center", "right"]
    : isKeychain || isCoaster
      ? ["front", "back"]
      : ["center"];

  // Determine if the product's shape is circular (Round variants)
  const isCircularVariant = (() => {
    const n = (template?.name || "").toLowerCase();
    const v = (template?.variantNo || "").toLowerCase();
    return n.includes("round") || v.includes("round");
  })();

  // Determine if the product's shape is heart-shaped (Heart variants)
  const isHeartVariant = (() => {
    const n = (template?.name || "").toLowerCase();
    return n.includes("heart");
  })();

  // MOQ step: Coasters have steps of 2/4/6/8, Iron on Stickers in multiples of 4
  const moqStep = (() => {
    if (isCoaster) return 2; // 2, 4, 6, 8 …
    if (isIronOnSticker) return 4; // 20, 24, 28 …
    return 1;
  })();
  const parsePrintSize = (raw) => {
    if (!raw) return null;
    const nums =
      String(raw)
        .match(/[\d.]+/g)
        ?.map(Number)
        .filter((n) => Number.isFinite(n)) || [];
    if (nums.length < 2) return null;
    const unit = String(raw).toLowerCase();
    const factor = unit.includes("inch") ? 25.4 : unit.includes("cm") ? 10 : 1;
    return {
      widthMm: nums[0] * factor,
      heightMm: nums[1] * factor,
    };
  };
  const printSizeMm = parsePrintSize(template?.printSize);
  const editorCanvasRatio = printSizeMm
    ? printSizeMm.widthMm / Math.max(1, printSizeMm.heightMm)
    : 2.1;
  const editorCanvasCssWidth = Math.round(
    Math.max(420, Math.min(760, editorCanvasRatio * 220)),
  );
  const editorCanvasCssHeight = Math.round(
    Math.max(
      180,
      Math.min(320, editorCanvasCssWidth / Math.max(1, editorCanvasRatio)),
    ),
  );
  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  // Match admin CreateTemplate.getSideShapeMapFromCanvas (rect → rectangle, mug-wrap primary)
  const placeholderShapeBySide = (() => {
    const objects = template?.canvasSettings?.objects || [];
    const placeholders = objects
      .filter((o) => o?.role === "placeholder")
      .sort((a, b) => (a?.left || 0) - (b?.left || 0));
    if (!placeholders.length) return {};
    const norm = (shape) =>
      shape === "rect" ? "rectangle" : shape || "rectangle";
    const cat = (template?.category || "").toLowerCase();
    const isWrapTpl =
      template?.wrapType === "mug" ||
      template?.wrapType === "bottle" ||
      template?.wrapType === "planter" ||
      cat.includes("mug") ||
      cat.includes("sipper") ||
      cat.includes("bottle") ||
      cat.includes("planter");
    const primaryWrap = placeholders.find(
      (p) => norm(p.shapeType) === "mug-wrap",
    );
    if (primaryWrap && isWrapTpl) {
      const wrapShape = norm(primaryWrap.shapeType);
      return { left: wrapShape, center: wrapShape, right: wrapShape };
    }
    if (placeholders.length === 1) {
      const shape = norm(placeholders[0]?.shapeType);
      return { left: shape, center: shape, right: shape };
    }
    if (placeholders.length === 2) {
      return {
        left: norm(placeholders[0]?.shapeType),
        center: norm(placeholders[0]?.shapeType),
        right: norm(placeholders[1]?.shapeType),
      };
    }
    return {
      left: norm(placeholders[0]?.shapeType),
      center: norm(
        placeholders[Math.floor(placeholders.length / 2)]?.shapeType,
      ),
      right: norm(placeholders[placeholders.length - 1]?.shapeType),
    };
  })();
  const adminMockupShapeBySide = (() => {
    const out = {};
    (template?.mockupViews || []).forEach((mv) => {
      const side = mv?.side || mv?.angleFocus || "center";
      if (mv?.shapeType) out[side] = mv.shapeType;
    });
    return out;
  })();
  const hasAdminLockedShapes = Object.keys(adminMockupShapeBySide).length > 0;
  const previewShapeBySide = {
    left:
      adminMockupShapeBySide.left ||
      slotAssets.left?.shapeType ||
      slotShapeOverrides.left ||
      (uploadShapeBySlot.left !== "auto"
        ? uploadShapeBySlot.left
        : placeholderShapeBySide.left),
    center:
      adminMockupShapeBySide.center ||
      slotAssets.center?.shapeType ||
      slotShapeOverrides.center ||
      (uploadShapeBySlot.center !== "auto"
        ? uploadShapeBySlot.center
        : placeholderShapeBySide.center),
    right:
      adminMockupShapeBySide.right ||
      slotAssets.right?.shapeType ||
      slotShapeOverrides.right ||
      (uploadShapeBySlot.right !== "auto"
        ? uploadShapeBySlot.right
        : placeholderShapeBySide.right),
  };

  // Sync quantity changes back to buyNowItem state
  useEffect(() => {
    if (template && buyNowItem?.template?._id === template._id) {
      setBuyNowItem((prev) => ({ ...prev, quantity }));
    }
  }, [quantity, template, setBuyNowItem]);

  // Fetch Template
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/templates/${id}`);
        setTemplate(data);

        // Initialize quantity to MOQ if not already carried over
        if (buyNowItem?.template?._id !== data._id) {
          setQuantity(data.moq || 1);
        }

        // Improved robust check for 3D-capable categories
        const catLower = (data.category || "").toLowerCase();
        const is3DType =
          catLower.includes("mug") ||
          catLower.includes("sipper") ||
          catLower.includes("bottle") ||
          catLower.includes("planter") ||
          catLower.includes("case") ||
          data.wrapType === "mug" ||
          data.wrapType === "bottle" ||
          data.wrapType === "planter" ||
          data.wrapType === "phone";

        if (is3DType) {
          setShowMugPreview(true);
          setCustomizationMode("wrapPhotos");
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchTemplate();
  }, [id]);

  // Body scroll lock
  useEffect(() => {
    if (previewModalOpen) {
      document.body.style.overflow = "hidden";
      // Scroll to top of overlay when opened
      const overlay = document.querySelector(".preview-overlay");
      if (overlay) overlay.scrollTop = 0;
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [previewModalOpen]);

  // Initialize Canvas
  useEffect(() => {
    if (!template || !canvasRef.current) return;

    const catL = (template.category || "").toLowerCase();
    const isWrap =
      catL.includes("mug") ||
      catL.includes("sipper") ||
      catL.includes("bottle") ||
      catL.includes("planter") ||
      template.wrapType === "mug" ||
      template.wrapType === "bottle" ||
      template.wrapType === "planter";
    const isPureWrapEditor =
      catL.includes("mug") ||
      catL.includes("sipper") ||
      catL.includes("bottle") ||
      catL.includes("planter") ||
      template.wrapType === "mug" ||
      template.wrapType === "bottle" ||
      template.wrapType === "planter";
    const isFlatProduct =
      catL.includes("keychain") ||
      catL.includes("coaster") ||
      catL.includes("fridge") ||
      catL.includes("magnet") ||
      catL.includes("iron") ||
      catL.includes("sticker");

    // Set dimensions: Based on printSize ratio for ALL products
    const wrapCanvasWidth = editorCanvasCssWidth;
    const wrapCanvasHeight = editorCanvasCssHeight;

    // ── Flat product canvas sizing (Keychain, Coaster, Magnet, Sticker) ──
    const isFlatCat =
      catL.includes("keychain") ||
      catL.includes("coaster") ||
      catL.includes("fridge") ||
      catL.includes("magnet") ||
      catL.includes("iron") ||
      catL.includes("sticker");

    let flatCanvasWidth = 320;
    let flatCanvasHeight = 320;
    if (isFlatCat && printSizeMm) {
      const ratio = printSizeMm.widthMm / Math.max(1, printSizeMm.heightMm);
      // Keep it compact and square-ish — max 380px
      if (ratio >= 0.9 && ratio <= 1.1) {
        // Nearly square (coasters, round/square keychains, magnets)
        flatCanvasWidth = 320;
        flatCanvasHeight = 320;
      } else if (ratio < 0.9) {
        // Portrait (tall stickers etc.)
        flatCanvasHeight = 380;
        flatCanvasWidth = Math.round(380 * ratio);
      } else {
        // Landscape (wide stickers)
        flatCanvasWidth = 380;
        flatCanvasHeight = Math.round(380 / ratio);
      }
      // Floor to sensible min
      flatCanvasWidth = Math.max(200, flatCanvasWidth);
      flatCanvasHeight = Math.max(200, flatCanvasHeight);
    } else if (isFlatCat) {
      // No printSize defined – use a compact square
      flatCanvasWidth = 300;
      flatCanvasHeight = 300;
    }

    // Non-wrap: derive portrait/landscape canvas from printSize, else default 380x520
    const nonWrapRatio = printSizeMm
      ? printSizeMm.widthMm / Math.max(1, printSizeMm.heightMm)
      : 380 / 520;
    const nonWrapCanvasWidth = printSizeMm
      ? Math.round(
          Math.min(
            380,
            Math.max(200, nonWrapRatio >= 1 ? 380 : 520 * nonWrapRatio),
          ),
        )
      : 380;
    const nonWrapCanvasHeight = printSizeMm
      ? Math.round(
          Math.min(
            520,
            Math.max(200, nonWrapCanvasWidth / Math.max(0.3, nonWrapRatio)),
          ),
        )
      : 520;

    let canvasWidth, canvasHeight;
    if (isWrap) {
      canvasWidth = wrapCanvasWidth;
      canvasHeight = wrapCanvasHeight;
    } else {
      canvasWidth = nonWrapCanvasWidth;
      canvasHeight = nonWrapCanvasHeight;
    }

    const initCanvas = new fabric.Canvas(canvasRef.current, {
      height: canvasHeight,
      width: canvasWidth,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });

    initCanvas.setDimensions({ width: canvasWidth, height: canvasHeight });
    if (initCanvas.wrapperEl) {
      initCanvas.wrapperEl.style.width = `${canvasWidth}px`;
      initCanvas.wrapperEl.style.height = `${canvasHeight}px`;
      initCanvas.wrapperEl.style.display = "block";
      initCanvas.wrapperEl.style.position = "relative";
      initCanvas.wrapperEl.style.touchAction = "none"; // Prevent browser scroll interference
    }
    if (initCanvas.lowerCanvasEl) {
      initCanvas.lowerCanvasEl.style.width = `${canvasWidth}px`;
      initCanvas.lowerCanvasEl.style.height = `${canvasHeight}px`;
      initCanvas.lowerCanvasEl.style.display = "block";
      initCanvas.lowerCanvasEl.style.touchAction = "none";
    }
    if (initCanvas.upperCanvasEl) {
      initCanvas.upperCanvasEl.style.width = `${canvasWidth}px`;
      initCanvas.upperCanvasEl.style.height = `${canvasHeight}px`;
      initCanvas.upperCanvasEl.style.display = "block";
      initCanvas.upperCanvasEl.style.touchAction = "none";
    }
    if (initCanvas.calcOffset) initCanvas.calcOffset();
    initCanvas.requestRenderAll();

    setCanvas(initCanvas);

    // Selection Events
    const handleSelection = (e) => {
      const obj = e.selected ? e.selected[0] : e.target || null;
      if (obj && (obj.locked === true || obj.locked === "true")) {
        initCanvas.discardActiveObject();
        setSelectedObject(null);
        return;
      }
      setSelectedObject(obj);
      setIsPanning(false);
    };

    const handleCleared = () => {
      setSelectedObject(null);
      setIsPanning(false);
    };

    // Robust way to keep the clipPath perfectly aligned with the placeholder
    const syncClipPathToPlaceholder = (obj) => {
      if (!obj.clipPath || !obj.maskRef) return;
      const mask = obj.maskRef;
      const center = mask.getCenterPoint();
      obj.clipPath.set({
        left: center.x,
        top: center.y,
        scaleX: mask.scaleX || 1,
        scaleY: mask.scaleY || 1,
        angle: mask.angle || 0,
        originX: "center",
        originY: "center",
        absolutePositioned: true,
      });
      obj.clipPath.setCoords();
    };

    // Constrain dragged images to stay inside their placeholder area and always COVER it
    const handleImageTransformation = (e) => {
      const obj = e.target;
      if (!obj) return;

      // Target ONLY the uploaded image inside the shape
      if (obj.role === "clipped-image" && obj.maskRef) {
        const mask = obj.maskRef;
        const mCenter = mask.getCenterPoint();
        const mW = mask.getScaledWidth();
        const mH = mask.getScaledHeight();

        // 1. Minimum Scale Constraint: Image must always be large enough to cover the mask
        // We use base object width and compare against scaled mask dimensions
        const minScaleX = mW / (obj.width || 1);
        const minScaleY = mH / (obj.height || 1);
        const minScale = Math.max(minScaleX, minScaleY);

        if (obj.scaleX < minScale) {
          obj.set({ scaleX: minScale, scaleY: minScale });
        }

        const iW = obj.getScaledWidth();
        const iH = obj.getScaledHeight();

        let newX = obj.left;
        let newY = obj.top;

        // 2. Position Constraint: Ensure the image always covers the entire mask area
        if (iW >= mW) {
          const limitX = (iW - mW) / 2;
          newX = Math.max(
            mCenter.x - limitX,
            Math.min(mCenter.x + limitX, newX),
          );
        } else {
          newX = mCenter.x;
        }

        if (iH >= mH) {
          const limitY = (iH - mH) / 2;
          newY = Math.max(
            mCenter.y - limitY,
            Math.min(mCenter.y + limitY, newY),
          );
        } else {
          newY = mCenter.y;
        }

        obj.set({ left: newX, top: newY });

        // Force clipPath (shape) to stay at placeholder position – only image moves, shape stays fixed
        syncClipPathToPlaceholder(obj);
        obj.setCoords();
      }
    };

    const handleObjectModified = (e) => {
      const obj = e.target;

      // ── Text resize: convert scale → fontSize on mouse-up so resize feels smooth ──
      if (obj && (obj.type === "i-text" || obj.type === "text")) {
        const newSize = Math.max(
          6,
          Math.round(obj.fontSize * Math.max(obj.scaleX, obj.scaleY)),
        );
        obj.set({ fontSize: newSize, scaleX: 1, scaleY: 1 });
        obj.setCoords();
        setSelectedObject((prev) =>
          prev === obj || prev?.oCoords === obj?.oCoords
            ? { ...obj, fontSize: newSize }
            : prev,
        );
        setTimeout(() => syncWrapPreviewFromCanvas(false, initCanvas), 0);
      }

      if (isPureWrapEditor || isFlatProduct) {
        setTimeout(() => syncWrapPreviewFromCanvas(false, initCanvas), 0);
      }
      if (obj && obj.role === "clipped-image" && obj.maskRef) {
        syncClipPathToPlaceholder(obj);
        const mask = obj.maskRef;
        const slot = obj.sideSlot || "center";
        const mW =
          mask.getScaledWidth?.() ?? mask.width * (mask.scaleX || 1) ?? 1;
        const mH =
          mask.getScaledHeight?.() ?? mask.height * (mask.scaleY || 1) ?? 1;
        const baseScale =
          Math.max(mW / (obj.width || 1), mH / (obj.height || 1)) || 1;
        const zoom = (obj.scaleX || baseScale) / baseScale;
        const maskCenter = mask.getCenterPoint
          ? mask.getCenterPoint()
          : { x: mask.left, y: mask.top };
        const offsetX = ((obj.left || maskCenter.x) - maskCenter.x) / mW;
        const offsetY = ((obj.top || maskCenter.y) - maskCenter.y) / mH;
        setSlotAssets((prev) => ({
          ...prev,
          [slot]: {
            ...prev[slot],
            transform: {
              zoom: Number.isFinite(zoom) ? zoom : 1,
              offsetX: Number.isFinite(offsetX) ? offsetX : 0,
              offsetY: Number.isFinite(offsetY) ? offsetY : 0,
            },
          },
        }));
        // Single-placeholder wrap templates mirror one edited position on all sides.
        const placeholderCount = getSortedPlaceholders(initCanvas).length;
        if (isWrap && placeholderCount <= 1 && slot === "center") {
          const mirrored = {
            zoom: Number.isFinite(zoom) ? zoom : 1,
            offsetX: Number.isFinite(offsetX) ? offsetX : 0,
            offsetY: Number.isFinite(offsetY) ? offsetY : 0,
          };
          setSlotAssets((prev) => ({
            ...prev,
            left: { ...prev.left, transform: mirrored },
            center: { ...prev.center, transform: mirrored },
            right: { ...prev.right, transform: mirrored },
          }));
        }
      }
    };

    const syncLabelToPlaceholder = (placeholder) => {
      const label = initCanvas
        .getObjects()
        .find(
          (o) =>
            o.role === "placeholder-label" &&
            (o.placeholderRef === placeholder ||
              o.id === `label_${placeholder.id}`),
        );
      if (label) {
        const center = placeholder.getCenterPoint();
        label.set({
          left: center.x,
          top: center.y,
          angle: placeholder.angle || 0,
        });
        // Dynamically adjust font size if shape becomes too small/large
        const w = placeholder.getScaledWidth();
        const h = placeholder.getScaledHeight();
        label.set({ fontSize: Math.max(8, Math.min(w, h) / 6) });
        label.setCoords();
      }
    };

    initCanvas.on("selection:created", handleSelection);
    initCanvas.on("selection:updated", handleSelection);
    initCanvas.on("selection:cleared", handleCleared);
    initCanvas.on("text:changed", (e) => {
      const obj = e.target;
      if (obj?.role === "side-text") {
        const slot = obj.sideSlot || "center";
        setPhotoTextValue(obj.text || "");
        setSlotAssets((prev) => ({
          ...prev,
          [slot]: {
            ...prev[slot],
            text: obj.text || "",
          },
        }));
        if (isPureWrapEditor) {
          setTimeout(() => {
            const allObjects = initCanvas.getObjects();
            const designObjects = allObjects.filter(
              (o) =>
                o.role === "clipped-image" ||
                o.role === "free-image" ||
                o.role === "side-text" ||
                (o.type === "i-text" && o.role !== "placeholder-label"),
            );
            const envObjects = allObjects.filter(
              (o) => !designObjects.includes(o),
            );
            const originalVis = envObjects.map((o) => ({
              obj: o,
              visible: o.visible,
            }));
            const originalBg = initCanvas.backgroundColor;
            envObjects.forEach((o) => o.set("visible", false));
            initCanvas.set("backgroundColor", null);
            const activeObj = initCanvas.getActiveObject();
            let controlsVis = true;
            if (activeObj) {
              controlsVis = activeObj.hasControls;
              activeObj.set({ hasControls: false, hasBorders: false });
            }
            initCanvas.renderAll();

            const snapshot = initCanvas.toDataURL({
              multiplier: 1,
              format: "png",
            });
            setPreviewImage(snapshot);
            setMugPreviewUrl(snapshot);
            setShowMugPreview(true);

            originalVis.forEach((item) =>
              item.obj.set("visible", item.visible),
            );
            initCanvas.set("backgroundColor", originalBg);

            if (activeObj) {
              activeObj.set({ hasControls: controlsVis, hasBorders: true });
            }
            initCanvas.renderAll();
          }, 0);
        }
      }
    });

    // ── Restore resize handles after user finishes typing ──────────────────
    // When IText is in edit mode (double-click), Fabric hides all scale handles.
    // On exit we must re-apply them so the user can resize again.
    initCanvas.on("text:editing:exited", (e) => {
      const obj = e.target;
      if (!obj) return;
      obj.set({ hasControls: true, hasBorders: true });
      obj.setControlsVisibility({
        mt: true,
        mb: true,
        ml: true,
        mr: true,
        tl: true,
        tr: true,
        bl: true,
        br: true,
        mtr: true,
      });
      // Re-select so the handles render immediately
      initCanvas.setActiveObject(obj);
      initCanvas.requestRenderAll();
      setSelectedObject({ ...obj }); // refresh React state so sidebar shows updated text
    });
    initCanvas.on("object:moving", (e) => {
      handleImageTransformation(e);
      if (e.target && e.target.role === "placeholder")
        syncLabelToPlaceholder(e.target);

      // ── Boundary Constraint for free-image (user uploads) ──
      const obj = e.target;
      if (obj && obj.role === "free-image") {
        const cW = initCanvas.width;
        const cH = initCanvas.height;
        const br = obj.getBoundingRect();
        if (br.width <= cW) {
          if (br.left < 0) obj.set("left", obj.left - br.left);
          else if (br.left + br.width > cW)
            obj.set("left", obj.left - (br.left + br.width - cW));
        }
        if (br.height <= cH) {
          if (br.top < 0) obj.set("top", obj.top - br.top);
          else if (br.top + br.height > cH)
            obj.set("top", obj.top - (br.top + br.height - cH));
        }
        obj.setCoords();
      }

      // Live preview update during move
      if (isPureWrapEditor || isFlatProduct) {
        if (initCanvas._liveSyncTimeout)
          clearTimeout(initCanvas._liveSyncTimeout);
        initCanvas._liveSyncTimeout = setTimeout(
          () => syncWrapPreviewFromCanvas(true, initCanvas),
          10,
        );
      }
    });
    initCanvas.on("object:scaling", (e) => {
      handleImageTransformation(e);
      if (e.target && e.target.role === "placeholder")
        syncLabelToPlaceholder(e.target);

      // Live preview update during scale
      if (isPureWrapEditor || isFlatProduct) {
        if (initCanvas._liveSyncTimeout)
          clearTimeout(initCanvas._liveSyncTimeout);
        initCanvas._liveSyncTimeout = setTimeout(
          () => syncWrapPreviewFromCanvas(true, initCanvas),
          10,
        );
      }
    });
    initCanvas.on("object:scaling", (e) => {
      const obj = e.target;
      if (obj && obj.role === "placeholder") syncLabelToPlaceholder(obj);
      // Live preview during scale for wrap/flat products
      if (isPureWrapEditor || isFlatProduct) {
        if (initCanvas._liveSyncTimeout)
          clearTimeout(initCanvas._liveSyncTimeout);
        initCanvas._liveSyncTimeout = setTimeout(
          () => syncWrapPreviewFromCanvas(true, initCanvas),
          10,
        );
      }
    });
    initCanvas.on("object:modified", handleObjectModified);

    // Keyboard Delete Logic
    const handleKeyDown = (e) => {
      // Bulletproof check for active input/textarea
      const activeTag = document.activeElement?.tagName;
      const isTyping =
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        document.activeElement?.isContentEditable;

      if (isTyping) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObj = initCanvas.getActiveObject();
        // ONLY delete if we are NOT in text editing mode
        if (activeObj && !activeObj.isEditing) {
          if (
            activeObj.locked === true ||
            activeObj.locked === "true" ||
            activeObj.role === "placeholder"
          ) {
            toast.error("Admin elements cannot be deleted");
            e.preventDefault();
            return;
          }
          // RESTORE PLACEHOLDER IF DELETING CLIPPED IMAGE
          if (activeObj.role === "clipped-image" && activeObj.maskRef) {
            const mask = activeObj.maskRef;
            mask.set({ visible: true, selectable: true, evented: true });
            const label = initCanvas
              .getObjects()
              .find(
                (obj) =>
                  obj.role === "placeholder-label" &&
                  (obj.placeholderRef === mask ||
                    obj.id === `label_${mask.id}`),
              );
            if (label) label.set({ visible: true });
          }

          initCanvas.remove(activeObj);
          initCanvas.renderAll();
          setSelectedObject(null);
          // Sync 3D preview after deletion
          if (typeof syncWrapPreviewFromCanvas === "function") {
            setTimeout(() => syncWrapPreviewFromCanvas(), 100);
          }
        }
      }
    };

    const handleKeyDownWrapper = (e) => handleKeyDown(e);
    window.addEventListener("keydown", handleKeyDownWrapper);

    const cleanup = () => {
      window.removeEventListener("keydown", handleKeyDownWrapper);
      if (initCanvas._liveSyncTimeout)
        clearTimeout(initCanvas._liveSyncTimeout);
      initCanvas.dispose();
    };

    initCanvas.on("mouse:down", (opt) => {
      if (opt.target) {
        // If specifically clicking the "Select Photo" label text, trigger upload immediately
        if (opt.target.role === "placeholder-label") {
          fileInputRef.current.click();
          initCanvas.activePlaceholder = opt.target.placeholderRef;
          // Discard selection so the label doesn't look like it's being edited
          initCanvas.discardActiveObject();
        }
        // If it's the placeholder (shape background), we DO NOT trigger upload here.
        // This allows the user to drag and resize smoothly on the first click.
      }
    });

    initCanvas.on("mouse:dblclick", (opt) => {
      if (opt.target) {
        const target =
          opt.target.role === "placeholder-label"
            ? opt.target.placeholderRef
            : opt.target;
        if (target && target.role === "placeholder") {
          fileInputRef.current.click();
          initCanvas.activePlaceholder = target;
        }
      }
    });

    const setupTemplate = async () => {
      // Wrap editor uses print-area canvas directly, so we skip product/mockup images here.
      // For Flat Products (Keychains, Coasters, etc), we ALSO skip the background image here,
      // because we want the Canvas to ONLY show the print area (the placeholder shape).
      // The background product image will instead be rendered via CSS on the Left-Side Preview.
      if (template.backgroundImageUrl && !isPureWrapEditor) {
        try {
          const isWebUrl = template.backgroundImageUrl.startsWith("http");
          const bgUrl = isWebUrl
            ? template.backgroundImageUrl +
              (template.backgroundImageUrl.includes("?") ? "&" : "?") +
              "t=" +
              new Date().getTime()
            : template.backgroundImageUrl;

          const img = await fabric.FabricImage.fromURL(bgUrl, {
            crossOrigin: isWebUrl ? "anonymous" : undefined,
          });

          const scale = Math.min(
            initCanvas.width / img.width,
            initCanvas.height / img.height,
          );
          img.set({
            scaleX: scale,
            scaleY: scale,
            left: initCanvas.width / 2,
            top: initCanvas.height / 2,
            originX: "center",
            originY: "center",
            selectable: false,
            evented: false,
          });

          initCanvas.add(img);
          initCanvas.sendObjectToBack(img);
          initCanvas.productImage = img;
          initCanvas.renderAll();
        } catch (error) {
          console.error("Failed to load background image:", error);
        }
      }

      // 2. Load Top Overlay
      if (
        template.overlayImageUrl &&
        template.overlayImageUrl.includes("http") &&
        !isPureWrapEditor
      ) {
        try {
          const img = await fabric.FabricImage.fromURL(
            template.overlayImageUrl,
            { crossOrigin: "anonymous" },
          );
          img.scaleToWidth(300);
          img.set({
            left: (initCanvas.width - img.getScaledWidth()) / 2,
            top: 50,
            selectable: false,
            evented: false,
          });
          initCanvas.overlayImage = img;
          initCanvas.add(img);
          initCanvas.bringObjectToFront(img);
          initCanvas.renderAll();
        } catch (error) {
          console.error("Failed to load overlay image:", error);
        }
      }

      // 3. Load Objects
      if (isPureWrapEditor) {
        initCanvas.renderAll();
        return;
      }

      if (template.canvasSettings && template.canvasSettings.objects) {
        try {
          const objectsToLoad = JSON.parse(
            JSON.stringify(template.canvasSettings.objects),
          ).map((obj) => {
            if (obj.src && obj.src.startsWith("http")) {
              obj.src =
                obj.src +
                (obj.src.includes("?") ? "&" : "?") +
                "t=" +
                new Date().getTime();
              obj.crossOrigin = "anonymous";
            }
            return obj;
          });

          const ORIGINAL_WIDTH = 400;
          const ORIGINAL_HEIGHT = 600;
          const offsetX = (initCanvas.width - ORIGINAL_WIDTH) / 2;
          const offsetY = (initCanvas.height - ORIGINAL_HEIGHT) / 2;

          const objs = await fabric.util.enlivenObjects(objectsToLoad);
          objs.forEach((item, index) => {
            const originalObj = objectsToLoad[index];
            if (originalObj.id === "background_image") return;

            if (item.left !== undefined) {
              item.set("left", item.left + offsetX);
            }
            if (item.top !== undefined) {
              item.set("top", item.top + offsetY);
            }

            // Restoration logic: Verify role/id from original JSON if missing on instance
            let role = item.role || originalObj.role;
            const id = item.id || originalObj.id;

            // Heuristic: older templates may not have role="placeholder" saved.
            // Detect photo areas by their admin styling:
            // Old: red dashed stroke (#ff6b6b) / soft pink fill
            // New: indigo dashed stroke (#6366f1 / #4f46e5)
            const looksLikeAdminPlaceholder =
              !role &&
              originalObj.strokeDashArray &&
              Array.isArray(originalObj.strokeDashArray) &&
              originalObj.strokeDashArray.length > 0 &&
              (originalObj.stroke === "#ff6b6b" ||
                originalObj.stroke === "#6366f1" ||
                originalObj.stroke === "#4f46e5" ||
                originalObj.fill === "rgba(255, 228, 225, 0.6)" ||
                originalObj.fill === "rgba(99, 102, 241, 0.1)");

            if (looksLikeAdminPlaceholder) {
              role = "placeholder";
            }

            // Placeholder logic
            if (role === "placeholder" || id === "user_photo_area") {
              // Preserve shapeType from original object (star, circle, etc.)
              const preservedShapeType =
                item.shapeType || originalObj.shapeType;

              item.set({
                role: "placeholder",
                id: id || `placeholder_${index}`, // Ensure ID is present
                shapeType: preservedShapeType, // CRITICAL: Preserve shapeType for clipping
                selectable: true,
                evented: true,
                // Unlock movement! User requested to move the shape
                lockMovementX: false,
                lockMovementY: false,
                lockScalingX: false,
                lockScalingY: false,
                lockRotation: false,

                strokeWidth: 2,
                stroke: "#6366f1", // Indigo-500
                strokeDashArray: [5, 5],
                fill: "rgba(99, 102, 241, 0.05)",

                cornerStyle: "circle",
                cornerColor: "#6366f1",
                borderColor: "#6366f1",
                transparentCorners: false,
                cornerSize: 10,
                hasRotatingPoint: true,

                originX: "center",
                originY: "center",
                hoverCursor: "pointer",
              });

              // Capture initial admin design for "Auto" restoration later
              const slots = ["left", "center", "right"];
              const placeholderSlot = item.slot || slots[index] || "center";
              initialPlaceholdersRef.current[placeholderSlot] = {
                left: item.left,
                top: item.top,
                width: item.width,
                height: item.height,
                scaleX: item.scaleX,
                scaleY: item.scaleY,
                angle: item.angle || 0,
                shapeType:
                  item.shapeType ||
                  (item.type === "circle" ? "circle" : "rectangle"),
                path: item.path ? item.path : null, // Store path if it's a Path object
                radius: item.radius || null,
              };

              // Also set on instance for serialization
              item.shapeType =
                item.shapeType ||
                (item.type === "circle" ? "circle" : "rectangle");
              item.slot = placeholderSlot;

              let w =
                item.type === "path" && item.getBoundingRect
                  ? item.getBoundingRect().width
                  : item.width * (item.scaleX || 1);
              let h =
                item.type === "path" && item.getBoundingRect
                  ? item.getBoundingRect().height
                  : item.height * (item.scaleY || 1);

              const center = (typeof item.getCenterPoint === "function"
                ? item.getCenterPoint()
                : null) || { x: item.left, y: item.top };
              const labelId = `label_${item.id}`;

              // Simplified blue text label centered in the gray shape
              const label = new fabric.IText("Select\nPhoto", {
                fontSize: Math.max(12, Math.min(w || 80, h || 80) / 6),
                fill: "#2563eb", // Professional Blue-600
                fontWeight: "bold",
                textAlign: "center",
                originX: "center",
                originY: "center",
                left: center.x,
                top: center.y,
                selectable: false,
                evented: true,
                hoverCursor: "pointer",
                role: "placeholder-label",
                id: labelId,
                placeholderRef: item,
                lineHeight: 1,
              });
              initCanvas.add(item, label);
            } else {
              // Let the user edit text objects (like 'Write Your Text') provided by the admin
              if (
                item.type === "i-text" ||
                item.type === "text" ||
                item.type === "textbox"
              ) {
                item.set({
                  selectable: true,
                  evented: true,
                  editable: true,
                  hoverCursor: "text",
                });
              } else {
                item.set({ selectable: false, evented: false });
              }
              initCanvas.add(item);
            }
          });
          initCanvas.renderAll();
          if (initCanvas.productImage)
            initCanvas.sendObjectToBack(initCanvas.productImage);
        } catch (e) {
          console.error(e);
        }
      }

      // Trigger initial preview sync for flat products to show the mockup immediately
      if (isFlatProduct || isPureWrapEditor) {
        setTimeout(() => syncWrapPreviewFromCanvas(false, initCanvas), 800);
      }
    };

    setupTemplate();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      initCanvas.off("selection:created", handleSelection);
      initCanvas.off("selection:updated", handleSelection);
      initCanvas.off("selection:cleared", handleCleared);
      initCanvas.off("object:moving", handleImageTransformation);
      initCanvas.off("object:scaling", handleImageTransformation);
      initCanvas.off("object:modified", handleObjectModified);
      initCanvas.dispose();
    };
  }, [template?._id]);

  // Helpers
  const handleDeleteSelected = () => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    if (
      activeObj.locked === true ||
      activeObj.locked === "true" ||
      activeObj.role === "placeholder"
    ) {
      toast.error("Admin elements cannot be deleted");
      return;
    }

    // RESTORE PLACEHOLDER IF DELETING CLIPPED IMAGE
    if (activeObj.role === "clipped-image" && activeObj.maskRef) {
      const mask = activeObj.maskRef;
      mask.set({ visible: true, selectable: true, evented: true });
      const label = canvas
        .getObjects()
        .find(
          (obj) =>
            obj.role === "placeholder-label" &&
            (obj.placeholderRef === mask || obj.id === `label_${mask.id}`),
        );
      if (label) label.set({ visible: true });
    }

    canvas.remove(activeObj);
    canvas.renderAll();
    setSelectedObject(null);
    if (typeof syncWrapPreviewFromCanvas === "function") {
      syncWrapPreviewFromCanvas();
    }
  };

  const handleObjectForward = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringObjectForward(selectedObject);
    canvas.renderAll();
    if (typeof syncWrapPreviewFromCanvas === "function")
      syncWrapPreviewFromCanvas();
  };

  const handleObjectBackward = () => {
    if (!canvas || !selectedObject) return;
    canvas.sendObjectBackward(selectedObject);
    canvas.renderAll();
    if (typeof syncWrapPreviewFromCanvas === "function")
      syncWrapPreviewFromCanvas();
  };

  const handleObjectDuplicate = async () => {
    if (!canvas || !selectedObject) return;
    if (selectedObject.role === "placeholder")
      return toast.error("Admin elements cannot be duplicated");
    const cloned = await selectedObject.clone();
    cloned.set({
      left: selectedObject.left + 20,
      top: selectedObject.top + 20,
    });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.renderAll();
    if (typeof syncWrapPreviewFromCanvas === "function")
      syncWrapPreviewFromCanvas();
  };
  const addToCanvas = (obj) => {
    if (!canvas) return;
    obj.set({
      left: canvas.width / 2,
      top: canvas.height / 2,
      originX: "center",
      originY: "center",
    });
    canvas.add(obj);
    canvas.setActiveObject(obj);
    if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);
    canvas.renderAll();
  };

  const addPhotoFrame = async (shapeType, pathData = null, overrides = {}) => {
    if (!canvas) return;

    let shape;
    const commonProps = {
      role: "placeholder",
      shapeType: shapeType,
      fill: "rgba(99, 102, 241, 0.05)", // Very light indigo fill
      stroke: "#6366f1", // Indigo-500 border
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      originX: "center",
      originY: "center",
      selectable: true,
      hoverCursor: "pointer",
      id: `user_frame_${Date.now()}`,
      cornerStyle: "circle",
      cornerColor: "#6366f1",
      borderColor: "#6366f1",
      transparentCorners: false,
      cornerSize: 10,
      hasRotatingPoint: true,
      // CRITICAL: Ensure we don't carry over old scales that cause shrinking/growing
      scaleX: 1,
      scaleY: 1,
      ...overrides,
    };

    // Use visible dimensions from overrides or defaults
    const targetWidth = overrides.width || 150;
    const targetHeight = overrides.height || 150;

    if (pathData) {
      shape = new fabric.Path(pathData, { ...commonProps });
    } else if (shapeType === "circle") {
      const r = Math.min(targetWidth, targetHeight) / 2;
      shape = new fabric.Circle({
        ...commonProps,
        radius: r,
        width: r * 2,
        height: r * 2,
      });
    } else if (shapeType === "heart") {
      const d = "M 50 90 C 100 50 100 0 50 30 C 0 0 0 50 50 90 Z";
      shape = new fabric.Path(d, {
        ...commonProps,
        width: 100,
        height: 100,
        scaleX: targetWidth / 100,
        scaleY: targetHeight / 100,
      });
    } else if (shapeType === "star") {
      const d =
        "M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z";
      shape = new fabric.Path(d, {
        ...commonProps,
        width: 100,
        height: 100,
        scaleX: targetWidth / 100,
        scaleY: targetHeight / 100,
      });
    } else if (shapeType === "mug-wrap") {
      const d = "M 0 10 Q 50 30 100 10 L 100 90 Q 50 110 0 90 Z";
      shape = new fabric.Path(d, {
        ...commonProps,
        width: 100,
        height: 100,
        scaleX: targetWidth / 100,
        scaleY: targetHeight / 100,
      });
    } else {
      shape = new fabric.Rect({
        ...commonProps,
        width: targetWidth,
        height: targetHeight,
      });
    }

    const center = {
      x: overrides.left !== undefined ? overrides.left : canvas.width / 2,
      y: overrides.top !== undefined ? overrides.top : canvas.height / 2,
    };
    shape.set({ left: center.x, top: center.y });

    // Add "Select Photo" Label
    const labelText = new fabric.IText("Select\nPhoto", {
      fontSize: Math.max(10, Math.min(18, targetWidth / 6)),
      fontFamily: "Arial",
      fill: "#2563eb",
      fontWeight: "bold",
      textAlign: "center",
      originX: "center",
      originY: "center",
      left: center.x,
      top: center.y,
      role: "placeholder-label",
      placeholderRef: shape,
      selectable: false,
      evented: true,
      hoverCursor: "pointer",
      id: `label_${shape.id}`,
    });

    // Linked movement logic
    shape.on("moving", () => {
      const p = shape.getCenterPoint();
      labelText.set({ left: p.x, top: p.y, angle: shape.angle || 0 });
      labelText.setCoords();
    });
    shape.on("scaling", () => {
      const p = shape.getCenterPoint();
      const w = shape.getScaledWidth();
      const h = shape.getScaledHeight();
      labelText.set({
        left: p.x,
        top: p.y,
        fontSize: Math.max(8, Math.min(w, h) / 6),
      });
      labelText.setCoords();
    });
    shape.on("rotating", () => {
      labelText.set({ angle: shape.angle || 0 });
      labelText.setCoords();
    });

    canvas.add(shape);
    canvas.add(labelText);
    canvas.setActiveObject(shape);
    if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);
    canvas.renderAll();
  };

  const getSortedPlaceholders = (targetCanvas) =>
    targetCanvas
      .getObjects()
      .filter((o) => o.role === "placeholder")
      .sort((a, b) => a.left - b.left);

  const resolvePlaceholderForSlot = (sortedPlaceholders, slot) => {
    if (!sortedPlaceholders.length) return null;
    if (sortedPlaceholders.length === 1) return sortedPlaceholders[0];
    if (sortedPlaceholders.length === 2) {
      if (slot === "right") return sortedPlaceholders[1];
      return sortedPlaceholders[0]; // left/center => first side
    }
    if (slot === "left") return sortedPlaceholders[0];
    if (slot === "right")
      return sortedPlaceholders[sortedPlaceholders.length - 1];
    return sortedPlaceholders[Math.floor(sortedPlaceholders.length / 2)];
  };

  const normalizeShapeType = (shape) => {
    const s = String(shape || "").toLowerCase();
    if (!s || s === "auto") return "auto";
    if (s === "rect") return "rectangle";
    return s;
  };

  const getEffectiveSlotShape = (slot) => {
    if (isStrictWrapShapeCategory) return "mug-wrap";
    if (hasAdminLockedShapes && adminMockupShapeBySide[slot]) {
      return normalizeShapeType(adminMockupShapeBySide[slot]);
    }
    const selected = normalizeShapeType(
      uploadShapeBySlot?.[slot] || selectedUploadShape,
    );
    if (selected !== "auto") return selected;
    return normalizeShapeType(placeholderShapeBySide?.[slot]) || "rectangle";
  };

  const resolveShapeTargetSlots = () => {
    if (!isWrapProduct) return ["center"];
    if (customizationMode === "singlePhotoBothSides")
      return ["left", "center", "right"];
    if (customizationMode === "photoAndText") return [photoSide];
    if (customizationMode === "wrapPhotos")
      return [shapeTargetSlot || "center"];
    return ["center"];
  };

  const applyUploadShapeSelection = async (shapeType) => {
    const normalized = isStrictWrapShapeCategory
      ? "mug-wrap"
      : normalizeShapeType(shapeType);
    setSelectedUploadShape(normalized);
    const targetSlots = resolveShapeTargetSlots();
    const currentSlot = getCurrentShapeTarget();

    setUploadShapeBySlot((prev) => {
      const next = { ...prev };
      targetSlots.forEach((slot) => {
        next[slot] = normalized;
      });
      return next;
    });

    if (canvas) {
      const objects = canvas.getObjects();
      const placeholders = objects.filter((o) => o.role === "placeholder");
      const targetPlaceholder =
        placeholders.find((p) => p.slot === currentSlot) || placeholders[0];

      if (targetPlaceholder) {
        // Determine target dimensions
        let width = targetPlaceholder.getScaledWidth();
        let height = targetPlaceholder.getScaledHeight();
        let left = targetPlaceholder.getCenterPoint().x;
        let top = targetPlaceholder.getCenterPoint().y;
        let angle = targetPlaceholder.angle;
        let pathData = null;
        let shapeToUse = normalized;

        // Handle 'Auto' reset to template defaults if possible
        if (normalized === "auto") {
          const original = initialPlaceholdersRef.current[currentSlot];
          if (original) {
            width = original.width * original.scaleX;
            height = original.height * original.scaleY;
            left = original.left;
            top = original.top;
            angle = original.angle;
            shapeToUse = original.shapeType;
            pathData = original.path;
          } else {
            // Fallback
            if (width < 50) {
              width = 200;
              height = 150;
            }
            shapeToUse =
              normalizeShapeType(placeholderShapeBySide?.[currentSlot]) ||
              "rectangle";
          }
        }

        const label = objects.find(
          (o) => o.id === `label_${targetPlaceholder.id}`,
        );
        if (label) canvas.remove(label);

        // ALSO remove any existing clipped image in this slot before adding a new shape
        const existingImage = objects.find(
          (o) =>
            o.role === "clipped-image" &&
            (o.sideSlot === currentSlot || o.maskRef === targetPlaceholder),
        );
        if (existingImage) canvas.remove(existingImage);

        canvas.remove(targetPlaceholder);

        await addPhotoFrame(shapeToUse, pathData, {
          left: left,
          top: top,
          width: width,
          height: height,
          angle: angle,
          slot: currentSlot,
        });

        canvas.renderAll();
      } else {
        addPhotoFrame(normalized, null, { slot: currentSlot });
      }
    }
  };

  const getCurrentShapeTarget = () => {
    if (!isWrapProduct) return "center";
    if (customizationMode === "singlePhotoBothSides") return "center";
    if (customizationMode === "photoAndText") return photoSide;
    if (customizationMode === "wrapPhotos") return shapeTargetSlot || "center";
    return "center";
  };

  // Keep shape selector synced with current mode/slot context.
  useEffect(() => {
    const slot = getCurrentShapeTarget();
    const current = isStrictWrapShapeCategory
      ? "mug-wrap"
      : uploadShapeBySlot?.[slot] || "auto";
    setSelectedUploadShape(current);
  }, [
    customizationMode,
    photoSide,
    shapeTargetSlot,
    isWrapProduct,
    uploadShapeBySlot,
    isStrictWrapShapeCategory,
  ]);

  useEffect(() => {
    if (!isStrictWrapShapeCategory && !isFlatProduct) return;
    setCustomizationMode("wrapPhotos");
    setPhotoSide(editorSide);
    setTextSide(editorSide);
    setShapeTargetSlot(editorSide);
    setActiveUploadSlot(editorSide);
  }, [editorSide, isStrictWrapShapeCategory, isFlatProduct]);

  // Multi-side visibility management for Flat Products
  useEffect(() => {
    if (!canvas || !isFlatProduct || isStrictWrapShapeCategory) return;

    const allObjects = canvas.getObjects();
    allObjects.forEach((obj) => {
      // Keep admin elements always visible
      if (
        obj.role === "placeholder" ||
        obj.role === "placeholder-label" ||
        obj.role === "editor-scene-background"
      ) {
        obj.set("visible", true);
      } else {
        // Design objects: match their sideSlot to current editorSide
        // Default to 'front' if no sideSlot assigned yet
        const objSide = obj.sideSlot || "front";
        obj.set(
          "visible",
          objSide === editorSide ||
            (editorSide === "center" && objSide === "front"),
        );
      }
    });
    canvas.renderAll();
    if (typeof syncWrapPreviewFromCanvas === "function")
      syncWrapPreviewFromCanvas();
  }, [editorSide, canvas, isFlatProduct, isStrictWrapShapeCategory]);

  useEffect(() => {
    if (!selectedObject) return;
    if (selectedObject.role === "side-text") {
      setEditorSide(selectedObject.sideSlot || "center");
      setTextSide(selectedObject.sideSlot || "center");
      setPhotoTextValue(selectedObject.text || "");
    }
  }, [selectedObject]);

  const buildMaskForShape = async (placeholder, shapeType) => {
    const shape = normalizeShapeType(shapeType);
    if (!placeholder || shape === "auto") {
      const cloned = await placeholder.clone();
      cloned.set({
        absolutePositioned: true,
        selectable: false,
        evented: false,
      });
      return cloned;
    }

    const center = placeholder.getCenterPoint();
    // Use unscaled dimensions for the procedural shape, then apply mask's scale for consistency
    const width =
      placeholder.width || (placeholder.radius ? placeholder.radius * 2 : 200);
    const height =
      placeholder.height || (placeholder.radius ? placeholder.radius * 2 : 200);

    const base = {
      left: center.x,
      top: center.y,
      originX: "center",
      originY: "center",
      scaleX: placeholder.scaleX || 1,
      scaleY: placeholder.scaleY || 1,
      angle: placeholder.angle || 0,
      absolutePositioned: true,
      evented: false,
      selectable: false,
    };

    if (shape === "rectangle") {
      return new fabric.Rect({ ...base, width, height });
    }
    if (shape === "circle") {
      const r = Math.min(width, height) / 2;
      return new fabric.Circle({ ...base, radius: r });
    }
    if (shape === "heart") {
      const w = width;
      const h = height;
      const d = `M ${w * 0.5} ${h * 0.95} C ${w * 1.05} ${h * 0.55}, ${w * 0.9} ${h * 0.1}, ${w * 0.5} ${h * 0.3} C ${w * 0.1} ${h * 0.1}, ${-w * 0.05} ${h * 0.55}, ${w * 0.5} ${h * 0.95} Z`;
      return new fabric.Path(d, { ...base });
    }
    if (shape === "mug-wrap") {
      const c = Math.max(8, Math.min(35, height * 0.2));
      const d = `M 0 ${c} Q ${width / 2} ${c * 2.5} ${width} ${c} L ${width} ${height} Q ${width / 2} ${height + c * 1.5} 0 ${height} Z`;
      return new fabric.Path(d, { ...base });
    }
    if (shape === "star") {
      const d =
        "M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z";
      return new fabric.Path(d, {
        ...base,
        width: 100,
        height: 100,
        scaleX: (width / 100) * base.scaleX,
        scaleY: (height / 100) * base.scaleY,
      });
    }
    if (shape === "triangle") {
      return new fabric.Triangle({ ...base, width, height });
    }

    const cloned = await placeholder.clone();
    cloned.set({ absolutePositioned: true, selectable: false, evented: false });
    return cloned;
  };

  const addCanvasTextToSide = (slotOverride = null) => {
    const targetSlot = slotOverride || textSide;
    if (!canvas) return;

    const slotXMap = {
      left: canvas.width * 0.25,
      center: canvas.width * 0.5,
      right: canvas.width * 0.75,
    };

    const existing = canvas
      .getObjects()
      .find((o) => o.role === "side-text" && o.sideSlot === targetSlot);

    if (existing) {
      canvas.setActiveObject(existing);
      if (typeof existing.enterEditing === "function") existing.enterEditing();
      canvas.renderAll();
      return;
    }

    const textObj = new fabric.IText("Text", {
      fontFamily: "Arial",
      fontSize: 34,
      fill: "#16a34a",
      fontWeight: "bold",
      originX: "center",
      originY: "center",
      left: slotXMap[targetSlot] || slotXMap.center,
      top: canvas.height / 2,
      role: "side-text",
      sideSlot: targetSlot,
      textSlot: targetSlot,
    });

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    if (typeof textObj.enterEditing === "function") textObj.enterEditing();
    if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);
    canvas.renderAll();
    setTextSide(targetSlot);
    setPhotoTextValue(textObj.text || "Text");
    setSlotAssets((prev) => ({
      ...prev,
      [targetSlot]: {
        ...prev[targetSlot],
        text: textObj.text || "Text",
      },
    }));
  };

  const upsertSideText = (slotOverride = null) => {
    const targetSlot = slotOverride || textSide;
    if (!canvas || !photoTextValue.trim()) {
      toast.error("Please enter text first");
      return;
    }

    const slotXMap = {
      left: canvas.width * 0.25,
      center: canvas.width * 0.5,
      right: canvas.width * 0.75,
    };

    canvas
      .getObjects()
      .filter((o) => o.role === "side-text")
      .forEach((o) => canvas.remove(o));

    const existing = canvas
      .getObjects()
      .find((o) => o.role === "side-text" && o.sideSlot === targetSlot);

    if (existing) {
      existing.set({ text: photoTextValue.trim() });
      canvas.setActiveObject(existing);
    } else {
      const textObj = new fabric.IText(photoTextValue.trim(), {
        fontFamily: "Arial",
        fontSize: 28,
        fill: "#111827",
        fontWeight: "bold",
        originX: "center",
        originY: "center",
        left: slotXMap[targetSlot] || slotXMap.right,
        top: canvas.height / 2,
        role: "side-text",
        sideSlot: targetSlot,
        textSlot: targetSlot,
      });
      canvas.add(textObj);
      canvas.setActiveObject(textObj);
    }

    if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);
    canvas.renderAll();
    setSlotAssets((prev) => ({
      ...prev,
      [targetSlot]: {
        ...prev[targetSlot],
        text: photoTextValue.trim(),
      },
    }));
    toast.success("Text applied");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) {
      if (canvas) canvas.activePlaceholder = null;
      return;
    }

    // Reset input value to allow re-uploading the same file
    e.target.value = "";

    const loadingToast = toast.loading("Uploading...");
    try {
      const slotsToApply = (() => {
        if (isStrictWrapShapeCategory) return ["wrap-layout"];
        if (!isWrapProduct) return [activeUploadSlot || "center"];
        const sortedPh = getSortedPlaceholders(canvas);
        const n = sortedPh.length;
        if (customizationMode === "singlePhotoBothSides") {
          // One print area on template: upload once, mirror URL to left/right for 3D preview
          if (n <= 1) return ["center"];
          return ["left", "right"];
        }
        if (customizationMode === "photoAndText") return [photoSide];
        return [activeUploadSlot || "center"];
      })();

      const localImageUrl = await readFileAsDataUrl(file);

      // ── Step 2: Start Cloudinary upload, but render locally first ───────────
      toast.loading("Uploading 0%", {
        id: loadingToast,
        style: {
          background: "#f0fdf4",
          border: "1px solid #86efac",
          color: "#16a34a",
        },
      });

      const formData = new FormData();
      formData.append("image", file);

      const uploadPromise = axios.post(`${API_BASE}/upload`, formData, {
        onUploadProgress: (ev) => {
          if (ev.total) {
            const pct = Math.round((ev.loaded * 100) / ev.total);
            toast.loading(`Uploading ${pct}%`, {
              id: loadingToast,
              style: {
                background: "#f0fdf4",
                border: "1px solid #86efac",
                color: "#16a34a",
                fontWeight: "bold",
              },
            });
          }
        },
      });

      let imageUrl = localImageUrl;

      // For BOTH wrap AND non-wrap that have no placeholder shapes → add as editable free image
      const hasSufficientPlaceholders =
        !isStrictWrapShapeCategory && getSortedPlaceholders(canvas).length > 0;

      if (isStrictWrapShapeCategory || !hasSufficientPlaceholders) {
        await addEditableImageToCanvas(localImageUrl);

        try {
          const uploadRes = await uploadPromise;
          imageUrl = uploadRes.data.url || localImageUrl;
        } catch (uploadErr) {
          console.error("Cloud upload failed after local preview:", uploadErr);
        }

        // Update slot assets so preview works
        const slot = activeUploadSlot || "center";
        setSlotAssets((prev) => ({
          ...prev,
          [slot]: {
            ...prev[slot],
            imageUrl,
            shapeType: "rectangle",
            transform: { zoom: 1, offsetX: 0, offsetY: 0 },
          },
        }));

        // Update preview snapshot
        setTimeout(() => {
          if (canvas) {
            canvas.discardActiveObject();
            canvas.renderAll();
            const snap = canvas.toDataURL({ format: "png", quality: 1 });
            setPreviewImage(snap);
          }
        }, 200);

        toast.success("Image added! Drag & resize on canvas.", {
          id: loadingToast,
        });
        setActiveUploadSlot(null);
        return;
      }

      // ── NEW: Handle User-Added Shape Filling ───────────────────────────
      if (canvas.activePlaceholder) {
        const placeholder = canvas.activePlaceholder;
        canvas.activePlaceholder = null;

        const img = await fabric.FabricImage.fromURL(localImageUrl);
        if (!img) return;

        // Clone shape as mask
        const clipMask = await placeholder.clone();
        clipMask.set({
          absolutePositioned: true,
          evented: false,
          selectable: false,
        });

        const pW = placeholder.getScaledWidth();
        const pH = placeholder.getScaledHeight();
        const center = placeholder.getCenterPoint();
        const scale = Math.max(pW / img.width, pH / img.height);

        img.set({
          left: center.x,
          top: center.y,
          originX: "center",
          originY: "center",
          angle: placeholder.angle || 0,
          scaleX: scale,
          scaleY: scale,
          clipPath: clipMask,
          role: "clipped-image",
          maskRef: placeholder,
          selectable: true,
          evented: true,
          perPixelTargetFind: true,
          lockRotatingPoint: true,
          cornerStyle: "circle",
          cornerColor: "#2563eb",
          borderColor: "#2563eb",
          transparentCorners: false,
        });

        img.setControlsVisibility({
          mt: false,
          mb: false,
          ml: false,
          mr: false,
          bl: true,
          br: true,
          tl: true,
          tr: true,
          mtr: false,
        });

        placeholder.set({
          visible: false,
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
        });

        const label = canvas
          .getObjects()
          .find(
            (o) =>
              o.role === "placeholder-label" &&
              (o.placeholderRef === placeholder ||
                o.id === `label_${placeholder.id}`),
          );
        if (label) label.set({ visible: false });

        canvas.add(img);
        canvas.setActiveObject(img);
        if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);
        canvas.renderAll();

        try {
          const uploadRes = await uploadPromise;
          imageUrl = uploadRes.data.url || localImageUrl;
        } catch (uploadErr) {
          console.error("Cloud upload failed after local preview:", uploadErr);
        }

        const placeholderSlot =
          placeholder.slot || activeUploadSlot || "center";
        setSlotAssets((prev) => ({
          ...prev,
          [placeholderSlot]: {
            ...prev[placeholderSlot],
            imageUrl,
            shapeType: "mug-wrap",
            transform: prev[placeholderSlot]?.transform || {
              zoom: 1,
              offsetX: 0,
              offsetY: 0,
            },
          },
        }));

        // ── Step 8: Trigger 3D preview visibility for relevant categories ───────────
        const catL = (template.category || "").toLowerCase();
        const nameL = (template.name || "").toLowerCase();
        const is3D =
          catL.includes("mug") ||
          catL.includes("sipper") ||
          catL.includes("bottle") ||
          catL.includes("planter") ||
          catL.includes("case") ||
          nameL.includes("mug") ||
          template?.wrapType === "mug" ||
          template?.wrapType === "bottle" ||
          template?.wrapType === "planter" ||
          template?.wrapType === "phone";

        if (is3D || isFlatProduct) {
          setTimeout(() => {
            if (canvas) {
              // 1. Capture FULL VIEW for display
              canvas.discardActiveObject();
              canvas.renderAll();
              const fullView = canvas.toDataURL({
                format: "png",
                quality: 1,
                multiplier: 2,
              });
              setPreviewImage(fullView);

              // 2. For 3D products, also capture DESIGN ONLY for 3D mapping
              if (is3D) {
                const allObjects = canvas.getObjects();
                const designObjects = allObjects.filter(
                  (o) =>
                    o.role === "clipped-image" ||
                    o.role === "side-text" ||
                    o.role === "free-image" ||
                    (o.type === "i-text" && o.role !== "placeholder-label"),
                );
                const nonDesignObjects = allObjects.filter(
                  (o) => !designObjects.includes(o),
                );
                const originalVis = nonDesignObjects.map((o) => ({
                  obj: o,
                  visible: o.visible,
                }));
                const originalBg = canvas.backgroundColor;

                nonDesignObjects.forEach((o) => o.set("visible", false));
                canvas.set("backgroundColor", null);
                canvas.renderAll();

                let exportOptions = {
                  format: "png",
                  quality: 1,
                  multiplier: 2,
                };
                if (designObjects.length > 0) {
                  let minX = Infinity,
                    minY = Infinity,
                    maxX = -Infinity,
                    maxY = -Infinity;
                  designObjects.forEach((obj) => {
                    const rect = obj.getBoundingRect(true);
                    minX = Math.min(minX, rect.left);
                    minY = Math.min(minY, rect.top);
                    maxX = Math.max(maxX, rect.left + rect.width);
                    maxY = Math.max(maxY, rect.top + rect.height);
                  });
                  const padding = 2;
                  exportOptions.left = Math.max(0, minX - padding);
                  exportOptions.top = Math.max(0, minY - padding);
                  exportOptions.width = Math.min(
                    canvas.width - exportOptions.left,
                    maxX - minX + padding * 2,
                  );
                  exportOptions.height = Math.min(
                    canvas.height - exportOptions.top,
                    maxY - minY + padding * 2,
                  );
                }

                const snapshot = canvas.toDataURL(exportOptions);
                setMugPreviewUrl(snapshot);
                setShowMugPreview(true);

                // Restore
                originalVis.forEach((item) =>
                  item.obj.set("visible", item.visible),
                );
                canvas.set("backgroundColor", originalBg);
                canvas.renderAll();
              }
            }
          }, 250);
        }

        toast.success("Photo added to shape!", { id: loadingToast });
        return;
      }
      // ──────────────────────────────────────────────────────────────────

      const putImageInSlot = async (slot) => {
        let img;
        try {
          img = await fabric.FabricImage.fromURL(localImageUrl);
        } catch (loadErr) {
          console.error("Image load failed:", loadErr);
          return;
        }
        if (!img || !img.width) return;

        const sorted = getSortedPlaceholders(canvas);
        const placeholder = resolvePlaceholderForSlot(sorted, slot);
        const slotXMap = {
          left: canvas.width * 0.25,
          center: canvas.width * 0.5,
          right: canvas.width * 0.75,
        };

        if (!placeholder) {
          const freeShape = getEffectiveSlotShape(slot);
          const oldFreeForSlot = canvas
            .getObjects()
            .find((o) => o.role === "free-image" && o.sideSlot === slot);
          if (oldFreeForSlot) canvas.remove(oldFreeForSlot);
          const scale =
            Math.min(
              (canvas.width * 0.3) / img.width,
              (canvas.height * 0.4) / img.height,
            ) || 0.5;
          img.set({
            left: slotXMap[slot] || slotXMap.center,
            top: canvas.height / 2,
            originX: "center",
            originY: "center",
            scaleX: scale,
            scaleY: scale,
            role: "free-image",
            sideSlot: slot,
            imageSlot: slot,
            selectable: true,
            evented: true,
            cornerStyle: "circle",
            cornerColor: "blue",
            borderColor: "blue",
            transparentCorners: false,
          });
          canvas.add(img);
          setSlotAssets((prev) => ({
            ...prev,
            [slot]: {
              ...prev[slot],
              imageUrl,
              shapeType: freeShape,
              transform: { zoom: 1, offsetX: 0, offsetY: 0 },
            },
          }));
          setSlotShapeOverrides((prev) => ({ ...prev, [slot]: freeShape }));
          return;
        }

        const effectiveShape = getEffectiveSlotShape(slot);
        let clipMask = null;
        try {
          clipMask = await buildMaskForShape(placeholder, effectiveShape);
          clipMask.set({
            absolutePositioned: true,
            evented: false,
            selectable: false,
          });
        } catch (cloneErr) {
          console.warn("Could not clone placeholder for clipPath:", cloneErr);
        }

        let pW;
        let pH;
        try {
          if (
            placeholder.type === "path" &&
            typeof placeholder.getBoundingRect === "function"
          ) {
            const r = placeholder.getBoundingRect();
            pW = r.width;
            pH = r.height;
          } else {
            pW =
              placeholder.getScaledWidth?.() ??
              placeholder.width * (placeholder.scaleX || 1);
            pH =
              placeholder.getScaledHeight?.() ??
              placeholder.height * (placeholder.scaleY || 1);
          }
        } catch {
          pW = 200;
          pH = 200;
        }
        if (!pW || !pH || !Number.isFinite(pW) || !Number.isFinite(pH)) {
          pW = 200;
          pH = 200;
        }

        const center =
          typeof placeholder.getCenterPoint === "function"
            ? placeholder.getCenterPoint()
            : { x: slotXMap[slot] || canvas.width / 2, y: canvas.height / 2 };
        const scale = Math.max(pW / img.width, pH / img.height);

        img.set({
          left: center.x,
          top: center.y,
          originX: "center",
          originY: "center",
          angle: placeholder.angle || 0,
          scaleX: scale,
          scaleY: scale,
          clipPath: clipMask || undefined,
          role: "clipped-image",
          sideSlot: slot,
          imageSlot: slot,
          maskRef: placeholder,
          selectable: true,
          evented: true,
          // Fix ghosting: only grab the photo where it's visible
          perPixelTargetFind: true,
          // Unlock scaling handles to allow zoom for horizontal panning
          lockScalingX: false,
          lockScalingY: false,
          lockRotation: true,
          hasControls: true,
          hasRotatingPoint: false,
          cornerStyle: "circle",
          cornerColor: "#2563eb", // Blue-600
          cornerSize: 10,
          borderColor: "#2563eb",
          transparentCorners: false,
        });

        // Enable essential controls
        img.setControlsVisibility({
          mt: false,
          mb: false,
          ml: false,
          mr: false,
          bl: true,
          br: true,
          tl: true,
          tr: true,
          mtr: false,
        });

        placeholder.set({
          visible: false,
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
        });

        const oldImage = canvas.getObjects().find((o) => {
          if (o.role !== "clipped-image") return false;
          // For wrap products, multiple side slots can share the same placeholder.
          // Replace only the image for the same side slot.
          if (isWrapProduct) return o.sideSlot === slot;
          return o.maskRef === placeholder || o.sideSlot === slot;
        });
        if (oldImage) canvas.remove(oldImage);

        const labelId = `label_${placeholder.id}`;
        const label = canvas
          .getObjects()
          .find(
            (o) =>
              o.id === labelId ||
              (o.role === "placeholder-label" &&
                o.placeholderRef === placeholder),
          );
        if (label) label.set({ visible: false });

        canvas.add(img);
        setSlotAssets((prev) => ({
          ...prev,
          [slot]: {
            ...prev[slot],
            imageUrl,
            shapeType: effectiveShape,
            transform: { zoom: 1, offsetX: 0, offsetY: 0 },
          },
        }));
        setSlotShapeOverrides((prev) => ({ ...prev, [slot]: effectiveShape }));
      };

      for (const slot of slotsToApply) {
        // eslint-disable-next-line no-await-in-loop
        await putImageInSlot(slot);
      }

      try {
        const uploadRes = await uploadPromise;
        imageUrl = uploadRes.data.url || localImageUrl;
        setSlotAssets((prev) => {
          const next = { ...prev };
          slotsToApply.forEach((slot) => {
            next[slot] = {
              ...next[slot],
              imageUrl,
            };
          });
          return next;
        });
      } catch (uploadErr) {
        console.error("Cloud upload failed after local preview:", uploadErr);
      }

      const phCount = getSortedPlaceholders(canvas).length;

      if (customizationMode === "singlePhotoBothSides") {
        const bothShape = getEffectiveSlotShape("center");
        setSlotAssets((prev) => ({
          ...prev,
          ...(phCount <= 1
            ? {
                left: {
                  ...prev.left,
                  imageUrl,
                  shapeType: bothShape,
                  transform: prev.center?.transform || {
                    zoom: 1,
                    offsetX: 0,
                    offsetY: 0,
                  },
                },
                right: {
                  ...prev.right,
                  imageUrl,
                  shapeType: bothShape,
                  transform: prev.center?.transform || {
                    zoom: 1,
                    offsetX: 0,
                    offsetY: 0,
                  },
                },
                center: {
                  ...prev.center,
                  imageUrl,
                  shapeType: bothShape,
                  transform: prev.center?.transform || {
                    zoom: 1,
                    offsetX: 0,
                    offsetY: 0,
                  },
                },
              }
            : {
                left: {
                  ...prev.left,
                  imageUrl,
                  shapeType: getEffectiveSlotShape("left"),
                  transform: prev.left?.transform || {
                    zoom: 1,
                    offsetX: 0,
                    offsetY: 0,
                  },
                },
                right: {
                  ...prev.right,
                  imageUrl,
                  shapeType: getEffectiveSlotShape("right"),
                  transform: prev.right?.transform || {
                    zoom: 1,
                    offsetX: 0,
                    offsetY: 0,
                  },
                },
              }),
        }));
        setSlotShapeOverrides((prev) => ({
          ...prev,
          left: phCount <= 1 ? bothShape : getEffectiveSlotShape("left"),
          right: phCount <= 1 ? bothShape : getEffectiveSlotShape("right"),
          ...(phCount <= 1 ? { center: bothShape } : {}),
        }));
      }

      if (customizationMode === "photoAndText") {
        setSlotAssets((prev) => ({
          ...prev,
          [photoSide]: {
            ...prev[photoSide],
            imageUrl,
            shapeType: getEffectiveSlotShape(photoSide),
            transform: prev[photoSide]?.transform || {
              zoom: 1,
              offsetX: 0,
              offsetY: 0,
            },
          },
          [textSide]: { ...prev[textSide], text: photoTextValue.trim() },
        }));
        setSlotShapeOverrides((prev) => ({
          ...prev,
          [photoSide]: getEffectiveSlotShape(photoSide),
        }));
      }

      canvas.activePlaceholder = null;
      const latestPlaced = canvas
        .getObjects()
        .find((o) => o.role === "clipped-image" || o.role === "free-image");
      if (latestPlaced) canvas.setActiveObject(latestPlaced);
      if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);

      canvas.renderAll();

      // ── Step 8: Trigger 3D preview visibility for relevant categories ───────────
      const catL = (template.category || "").toLowerCase();
      const nameL = (template.name || "").toLowerCase();
      const is3D =
        catL.includes("mug") ||
        catL.includes("sipper") ||
        catL.includes("bottle") ||
        catL.includes("planter") ||
        catL.includes("case") ||
        nameL.includes("mug") ||
        template?.wrapType === "mug" ||
        template?.wrapType === "bottle" ||
        template?.wrapType === "planter" ||
        template?.wrapType === "phone";

      if (is3D || isFlatProduct) {
        // Wait briefly for canvas to finish updating, then take snapshots
        setTimeout(() => {
          if (canvas) {
            // 1. Capture FULL VIEW for display
            canvas.discardActiveObject();
            canvas.renderAll();
            const fullView = canvas.toDataURL({
              format: "png",
              quality: 1,
              multiplier: 2,
            });
            setPreviewImage(fullView);

            // 2. For 3D products, also capture DESIGN ONLY for 3D mapping
            if (is3D) {
              const allObjects = canvas.getObjects();
              const designObjects = allObjects.filter(
                (o) =>
                  o.role === "clipped-image" ||
                  o.role === "side-text" ||
                  o.role === "free-image" ||
                  (o.type === "i-text" && o.role !== "placeholder-label"),
              );
              const nonDesignObjects = allObjects.filter(
                (o) => !designObjects.includes(o),
              );
              const originalVis = nonDesignObjects.map((o) => ({
                obj: o,
                visible: o.visible,
              }));
              const originalBg = canvas.backgroundColor;

              nonDesignObjects.forEach((o) => o.set("visible", false));
              canvas.set("backgroundColor", null);
              canvas.renderAll();

              let exportOptions = { format: "png", quality: 1, multiplier: 2 };
              if (designObjects.length > 0) {
                let minX = Infinity,
                  minY = Infinity,
                  maxX = -Infinity,
                  maxY = -Infinity;
                designObjects.forEach((obj) => {
                  const rect = obj.getBoundingRect(true);
                  minX = Math.min(minX, rect.left);
                  minY = Math.min(minY, rect.top);
                  maxX = Math.max(maxX, rect.left + rect.width);
                  maxY = Math.max(maxY, rect.top + rect.height);
                });
                const padding = 2;
                exportOptions.left = Math.max(0, minX - padding);
                exportOptions.top = Math.max(0, minY - padding);
                exportOptions.width = Math.min(
                  canvas.width - exportOptions.left,
                  maxX - minX + padding * 2,
                );
                exportOptions.height = Math.min(
                  canvas.height - exportOptions.top,
                  maxY - minY + padding * 2,
                );
              }

              const snapshot = canvas.toDataURL(exportOptions);
              setMugPreviewUrl(snapshot);
              setShowMugPreview(true);

              // Restore visibility and background
              originalVis.forEach((item) =>
                item.obj.set("visible", item.visible),
              );
              canvas.set("backgroundColor", originalBg);
              canvas.renderAll();
            }
          }
        }, 250);
      }

      toast.success("Image uploaded! Drag to reposition.", {
        id: loadingToast,
        style: {
          background: "#f0fdf4",
          border: "1px solid #86efac",
          color: "#16a34a",
          fontWeight: "bold",
        },
      });

      // Reset the layout slot
      setActiveUploadSlot(null);
    } catch (err) {
      console.error("Upload Error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Error uploading image";
      toast.error(msg, { id: loadingToast });
    }
  };

  // ── Helper: Upload Design ─────────────────────────────
  const uploadDesign = async (dataUrl) => {
    const blob = await (await fetch(dataUrl)).blob();
    const formData = new FormData();
    formData.append("image", blob, "final_design.png");
    const { data } = await axios.post(`${API_BASE}/upload`, formData);
    return data;
  };

  const handleAddToCart = async (directBuy = false) => {
    if (!user) return toast.error("Please login first");
    setLoadingAction(directBuy ? "order" : "cart");
    const loadingToast = toast.loading(
      directBuy ? "Preparing Checkout..." : "Adding to Cart...",
    );

    try {
      // IMPROVED: Hide ALL non-design elements for a clean export
      const allObjects = canvas.getObjects();
      const designObjects = allObjects.filter(
        (o) =>
          o.role === "clipped-image" ||
          o.role === "side-text" ||
          o.role === "free-image" ||
          (o.type === "i-text" && o.role !== "placeholder-label"),
      );
      const envObjects = allObjects.filter((o) => !designObjects.includes(o));

      // Save original visibility and background
      const originalVis = envObjects.map((o) => ({
        obj: o,
        visible: o.visible,
      }));
      const originalBg = canvas.backgroundColor;

      envObjects.forEach((o) => o.set("visible", false));
      canvas.set("backgroundColor", null);
      canvas.discardActiveObject();
      canvas.renderAll();

      // Calculate bounding box for cropped export
      let exportOptions = { multiplier: 2, format: "png" };
      if (designObjects.length > 0) {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        designObjects.forEach((obj) => {
          const rect = obj.getBoundingRect(true);
          minX = Math.min(minX, rect.left);
          minY = Math.min(minY, rect.top);
          maxX = Math.max(maxX, rect.left + rect.width);
          maxY = Math.max(maxY, rect.top + rect.height);
        });
        const padding = 2;
        exportOptions.left = Math.max(0, minX - padding);
        exportOptions.top = Math.max(0, minY - padding);
        exportOptions.width = Math.min(
          canvas.width - exportOptions.left,
          maxX - minX + padding * 2,
        );
        exportOptions.height = Math.min(
          canvas.height - exportOptions.top,
          maxY - minY + padding * 2,
        );
      }

      const data = await uploadDesign(canvas.toDataURL(exportOptions));

      // Restore visibility and background
      originalVis.forEach((item) => item.obj.set("visible", item.visible));
      canvas.set("backgroundColor", originalBg);
      canvas.renderAll();

      const uploadedImages = Object.values(slotAssets)
        .map((s) => s.imageUrl)
        .filter((url) => !!url);

      const payload = {
        template: template._id,
        customizedJson: canvas.toJSON(),
        slotAssets: slotAssets,
        userUploadedImages: [...new Set(uploadedImages)],
        finalImageUrl: data.url,
        price: template.basePrice,
        quantity: quantity,
        packingCharges: template.packingCharges || 0,
        shippingCharges: template.shippingCharges || 0,
        templateData: template,
      };

      if (directBuy) {
        // IMPORTANT: Separate flow for "Buy Now" - don't go to permanent cart
        setBuyNowItem({
          ...payload,
          template: template, // store full template object for checkout display
        });
        toast.success("Design Ready!", { id: loadingToast });
        navigate(`/checkout?id=${template._id}`);
      } else {
        await addToCart(payload);
        toast.success("Added to cart!", { id: loadingToast });
      }
    } catch (e) {
      console.error(e);
      toast.error("Process failed. Try again.", { id: loadingToast });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePreview = () => {
    if (!canvas) return;

    // 1. Capture FULL VIEW (Design + Product) for the 2D Display
    canvas.discardActiveObject();
    canvas.renderAll();

    // IMPROVED: Calculate crop for the Full View to make it "Larger" in the UI
    let fullExportOptions = { multiplier: 2, format: "png" };
    const visibleObjects = canvas.getObjects().filter((o) => o.visible);
    if (visibleObjects.length > 0) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      visibleObjects.forEach((obj) => {
        const rect = obj.getBoundingRect(true);
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.left + rect.width);
        maxY = Math.max(maxY, rect.top + rect.height);
      });
      const p = 12; // Padding to ensure shadows aren't cut
      fullExportOptions.left = Math.max(0, minX - p);
      fullExportOptions.top = Math.max(0, minY - p);
      fullExportOptions.width = Math.min(
        canvas.width - fullExportOptions.left,
        maxX - minX + p * 2,
      );
      fullExportOptions.height = Math.min(
        canvas.height - fullExportOptions.top,
        maxY - minY + p * 2,
      );
    }
    const fullViewUrl = canvas.toDataURL(fullExportOptions);
    setPreviewImage(fullViewUrl);

    // 2. Identify and hide non-design elements for the 3D/Design Only view
    const allObjects = canvas.getObjects();
    const designObjects = allObjects.filter(
      (o) =>
        o.role === "clipped-image" ||
        o.role === "side-text" ||
        o.role === "free-image" ||
        (o.type === "i-text" && o.role !== "placeholder-label"),
    );
    const envObjects = allObjects.filter((o) => !designObjects.includes(o));

    const originalVis = envObjects.map((o) => ({ obj: o, visible: o.visible }));
    const originalBg = canvas.backgroundColor;

    envObjects.forEach((o) => o.set("visible", false));
    canvas.set("backgroundColor", null);
    canvas.renderAll();

    // 3. Export DESIGN ONLY (Cropped to visible design for better 3D fit)
    let exportOptions = { multiplier: 2, format: "png" };
    if (designObjects.length > 0) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      designObjects.forEach((obj) => {
        const rect = obj.getBoundingRect(true);
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.left + rect.width);
        maxY = Math.max(maxY, rect.top + rect.height);
      });
      const padding = 2;
      exportOptions.left = Math.max(0, minX - padding);
      exportOptions.top = Math.max(0, minY - padding);
      exportOptions.width = Math.min(
        canvas.width - exportOptions.left,
        maxX - minX + padding * 2,
      );
      exportOptions.height = Math.min(
        canvas.height - exportOptions.top,
        maxY - minY + padding * 2,
      );
    }
    const designOnlyUrl = canvas.toDataURL(exportOptions);

    // 4. Restore visibility and background
    originalVis.forEach((item) => item.obj.set("visible", item.visible));
    canvas.set("backgroundColor", originalBg);
    canvas.renderAll();

    // 5. Set URLs for modal
    const catLower = (template.category || "").toLowerCase();
    const is3D =
      catLower.includes("mug") ||
      catLower.includes("sipper") ||
      catLower.includes("bottle") ||
      catLower.includes("planter") ||
      catLower.includes("case") ||
      template?.wrapType === "mug" ||
      template?.wrapType === "bottle" ||
      template?.wrapType === "planter" ||
      template?.wrapType === "phone";

    if (is3D || showMugPreview) {
      setMugPreviewUrl(designOnlyUrl);
    }

    setPreviewModalOpen(true);
  };

  const cycleEditorSide = (direction) => {
    if (!editorSides.length) return;
    const currentIndex = editorSides.indexOf(editorSide);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex =
      (safeIndex + direction + editorSides.length) % editorSides.length;
    setEditorSide(editorSides[nextIndex]);
  };

  const handleEditorImageUpload = () => {
    setCustomizationMode("wrapPhotos");
    setActiveUploadSlot(editorSide);
    fileInputRef.current?.click();
  };

  const uploadImageForSide = (side) => {
    setEditorSide(side);
    setCustomizationMode("wrapPhotos");
    setActiveUploadSlot(side);
    setShapeTargetSlot(side);
    fileInputRef.current?.click();
  };

  const handleEditorBackgroundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;
    e.target.value = "";

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const img = await fabric.FabricImage.fromURL(dataUrl);
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height,
      );
      const existingBg = canvas
        .getObjects()
        .find((o) => o.role === "editor-scene-background");
      if (existingBg) canvas.remove(existingBg);

      img.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        evented: true,
        role: "editor-scene-background",
        cornerStyle: "circle",
        cornerColor: "#2563eb",
        borderColor: "#2563eb",
        transparentCorners: false,
      });
      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();
    } catch (err) {
      console.error(err);
    }
  };

  const clearEditorBackground = () => {
    if (!canvas) return;
    const existingBg = canvas
      .getObjects()
      .find((o) => o.role === "editor-scene-background");
    if (existingBg) {
      canvas.remove(existingBg);
      canvas.renderAll();
    }
  };

  const syncWrapPreviewFromCanvas = (
    isInteractive = false,
    targetCanvas = null,
  ) => {
    const activeCanvas = targetCanvas || canvas;
    if (!activeCanvas) return;
    const allObjects = activeCanvas.getObjects();
    const designObjects = allObjects.filter(
      (o) =>
        o.role === "clipped-image" ||
        o.role === "free-image" ||
        o.role === "side-text" ||
        (o.type === "i-text" && o.role !== "placeholder-label"),
    );
    const envObjects = allObjects.filter((o) => !designObjects.includes(o));
    const originalVis = envObjects.map((o) => ({ obj: o, visible: o.visible }));
    const originalBg = activeCanvas.backgroundColor;

    // Interactive sync is faster: don't hide background if possible, or use lower multiplier
    if (!isFlatProduct) {
      envObjects.forEach((o) => o.set("visible", false));
    }
    activeCanvas.set(
      "backgroundColor",
      isFlatProduct ? activeCanvas.backgroundColor : null,
    );

    // Don't discard selection during interactive drag (causes flicker/shaking)
    if (!isInteractive) activeCanvas.discardActiveObject();

    activeCanvas.renderAll();

    const snapshot = activeCanvas.toDataURL({
      multiplier: isInteractive ? 1 : 2,
      format: "png",
      quality: isInteractive ? 0.6 : 1,
    });
    setPreviewImage(snapshot);
    setMugPreviewUrl(snapshot);
    setShowMugPreview(true);

    originalVis.forEach((item) => item.obj.set("visible", item.visible));
    canvas.set("backgroundColor", originalBg);
    canvas.renderAll();
  };

  const addEditableImageToCanvas = async (sourceUrl) => {
    if (!canvas || !sourceUrl) return null;
    const img = await fabric.FabricImage.fromURL(sourceUrl);
    const existingWrapImages = canvas
      .getObjects()
      .filter((o) => o.role === "free-image");
    const offset = existingWrapImages.length * 18;
    // Scale to fit within canvas (85% of binding dimension) — image will never exceed canvas size
    const scale = Math.min(
      (canvas.width * 0.85) / img.width,
      (canvas.height * 0.85) / img.height,
    );

    img.set({
      left: canvas.width / 2 + offset,
      top: canvas.height / 2 + offset,
      originX: "center",
      originY: "center",
      scaleX: scale,
      scaleY: scale,
      role: "free-image",
      sideSlot: editorSide,
      selectable: true,
      evented: true,
      stroke: "rgba(99,102,241,0.6)",
      strokeWidth: 2,
      cornerStyle: "circle",
      cornerColor: "#6366f1",
      borderColor: "#6366f1",
      cornerSize: 10,
      transparentCorners: false,
    });
    img.setCoords();
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.bringObjectToFront(img);
    if (canvas.calcOffset) canvas.calcOffset();
    canvas.renderAll();
    // Delay preview sync so canvas renders first
    setTimeout(() => syncWrapPreviewFromCanvas(), 100);
    return img;
  };

  const handleEditorAddText = () => {
    if (!canvas) return;
    const textObj = new fabric.IText("Your Text", {
      fontFamily: "Arial",
      fontSize: 40,
      fill: "#E11D48",
      fontWeight: "bold",
      originX: "center",
      originY: "center",
      left: canvas.width / 2,
      top: canvas.height / 2,
      role: "side-text",
      sideSlot: editorSide,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: false,
      cornerColor: "#6366f1",
      cornerSize: 12,
      cornerStyle: "circle",
      borderColor: "#6366f1",
      borderScaleFactor: 2,
      // Allow only uniform scaling so text doesn't distort
      lockUniScaling: false,
    });

    // Show all 8 scale handles + rotation handle so user can drag to resize
    textObj.setControlsVisibility({
      mt: true, // middle-top
      mb: true, // middle-bottom
      ml: true, // middle-left
      mr: true, // middle-right
      tl: true, // top-left corner
      tr: true, // top-right corner
      bl: true, // bottom-left corner
      br: true, // bottom-right corner
      mtr: true, // rotation handle
    });

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.bringObjectToFront(textObj);
    canvas.renderAll();
    // Trigger live preview so mug/product preview updates
    setTimeout(() => syncWrapPreviewFromCanvas(true), 50);
  };

  const currentSideAsset = slotAssets?.[editorSide] || {};

  const WrapEditorLayout = () => (
    <Layout style={{ minHeight: "calc(100vh - 80px)", background: "#efefef" }}>
      <Content style={{ padding: "16px 12px" }}>
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-xs font-black text-[#1e293b] shadow-sm uppercase tracking-[0.15em]"
            >
              <FaArrowLeft className="text-sm" /> Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase text-slate-500">
                {template.name}
              </span>
              <button
                onClick={handlePreview}
                className="px-4 py-2 rounded-full bg-[#111] text-white text-xs font-black uppercase tracking-[0.15em]"
              >
                Preview
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1fr] gap-4">
            <div className="bg-[#222] rounded-[18px] min-h-[640px] p-4 flex items-center justify-center overflow-hidden">
              <div className="w-full max-w-[560px]">
                <MugWrapPreview
                  photoUrl={mugPreviewUrl || previewImage || null}
                  templateBgUrl={template?.backgroundImageUrl}
                  mockupViews={template?.mockupViews}
                  slotAssets={{}}
                  placeholderShapeBySide={previewShapeBySide}
                  printSizeMm={printSizeMm}
                  wrapType={
                    template?.wrapType ||
                    (() => {
                      const cat = (template.category || "").toLowerCase();
                      if (cat.includes("mug")) return "mug";
                      if (cat.includes("sipper")) return "bottle";
                      if (cat.includes("bottle")) return "bottle";
                      if (cat.includes("planter")) return "planter";
                      return "mug";
                    })()
                  }
                />
              </div>
            </div>

            <div className="bg-[#333] rounded-[18px] border border-[#4a4a4a] p-3 text-white">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {["Add Text", "Preview", "Clear Canvas"].map((label) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (label === "Add Text") handleEditorAddText();
                      if (label === "Preview") handlePreview();
                      if (label === "Clear Canvas" && canvas) {
                        canvas.getObjects().forEach((o) => {
                          if (o.role === "free-image" || o.role === "side-text")
                            canvas.remove(o);
                        });
                        canvas.renderAll();
                        syncWrapPreviewFromCanvas();
                      }
                    }}
                    className="border border-[#d8d8d8] text-white text-xs font-bold py-2 bg-transparent hover:bg-white/10 transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-transparent border border-white/70" />
                <input
                  value="#222222"
                  readOnly
                  className="w-24 bg-white text-[#222] border-none px-2 py-1 text-xs font-semibold"
                />
                <span className="text-xs text-gray-300">Scene background</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => editorBgInputRef.current?.click()}
                  className="py-3 text-sm font-semibold transition-all border border-white/70 hover:bg-white/10"
                >
                  Add Background Image
                </button>
                <button
                  onClick={clearEditorBackground}
                  className="py-3 text-sm font-semibold transition-all border border-white/70 hover:bg-white/10"
                >
                  Clear Background Image
                </button>
              </div>

              <p className="mb-2 text-xs text-gray-200">
                Layout size (mm):{" "}
                {printSizeMm
                  ? `${Math.round(printSizeMm.widthMm)} x ${Math.round(printSizeMm.heightMm)}`
                  : template.printSize || "Not set"}
              </p>

              <div className="border border-[#cfcfcf] bg-[#f5f5f5] p-2 mb-3">
                <p className="text-[10px] text-[#333] mb-1">
                  Canvas objects: {canvas ? canvas.getObjects().length : 0}
                </p>
                <div className="bg-[linear-gradient(45deg,#efefef_25%,transparent_25%),linear-gradient(-45deg,#efefef_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#efefef_75%),linear-gradient(-45deg,transparent_75%,#efefef_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0px] min-h-[360px] overflow-auto">
                  <div
                    style={{
                      width: `${editorCanvasCssWidth}px`,
                      height: `${editorCanvasCssHeight}px`,
                      position: "relative",
                      background: "transparent",
                      border: "1px dashed rgba(0,0,0,0.08)",
                      margin: "0 auto",
                      touchAction: "none", // Prevent screen shaking/scrolling during drag
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      style={{
                        display: "block",
                        background: "transparent",
                        touchAction: "none",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={handleEditorImageUpload}
                  className="py-3 text-sm font-semibold transition-all border border-white/70 hover:bg-white/10"
                >
                  Add Image
                </button>
                <button
                  onClick={handleEditorAddText}
                  className="py-3 text-sm font-semibold transition-all border border-white/70 hover:bg-white/10"
                >
                  Add Text
                </button>
              </div>

              {(selectedObject?.role === "clipped-image" ||
                selectedObject?.role === "free-image") && (
                <div className="mb-4">
                  <label className="block mb-2 text-xs font-bold">
                    Image Scale
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    className="w-full"
                    value={
                      selectedObject.role === "clipped-image"
                        ? selectedObject.scaleX /
                          (selectedObject.maskRef?.getScaledWidth() /
                            selectedObject.width)
                        : selectedObject.scaleX || 1
                    }
                    onChange={(e) => {
                      const zoom = parseFloat(e.target.value);
                      const newScale =
                        selectedObject.role === "clipped-image"
                          ? Math.max(
                              selectedObject.maskRef.getScaledWidth() /
                                selectedObject.width,
                              selectedObject.maskRef.getScaledHeight() /
                                selectedObject.height,
                            ) * zoom
                          : zoom;
                      selectedObject.set({
                        scaleX: newScale,
                        scaleY: newScale,
                      });
                      canvas.renderAll();
                      // Live sync from slider too
                      if (canvas._liveSyncTimeout)
                        clearTimeout(canvas._liveSyncTimeout);
                      canvas._liveSyncTimeout = setTimeout(
                        () => syncWrapPreviewFromCanvas(true),
                        50,
                      );
                    }}
                    onMouseUp={() => syncWrapPreviewFromCanvas()}
                    onTouchEnd={() => syncWrapPreviewFromCanvas()}
                  />
                </div>
              )}

              {(selectedObject?.type === "i-text" ||
                selectedObject?.type === "text") && (
                <div className="mb-4 space-y-3">
                  <textarea
                    value={selectedObject.text || ""}
                    onChange={(e) => {
                      selectedObject.set("text", e.target.value);
                      canvas.requestRenderAll();
                      setSelectedObject({
                        ...selectedObject,
                        text: e.target.value,
                      });

                      // LIVE PREVIEW DEBOUNCED
                      if (canvas._typingSyncTimeout)
                        clearTimeout(canvas._typingSyncTimeout);
                      canvas._typingSyncTimeout = setTimeout(() => {
                        if (canvas.getActiveObject() === selectedObject) {
                          syncWrapPreviewFromCanvas(true);
                        }
                      }, 500);
                    }}
                    rows={3}
                    className="w-full p-2 text-black border rounded outline-none border-slate-300"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="color"
                      defaultValue={selectedObject.fill || "#000000"}
                      onInput={(e) => {
                        selectedObject.set("fill", e.target.value);
                        canvas.requestRenderAll();
                        if (canvas._liveSyncTimeout)
                          clearTimeout(canvas._liveSyncTimeout);
                        canvas._liveSyncTimeout = setTimeout(
                          () => syncWrapPreviewFromCanvas(true),
                          50,
                        );
                      }}
                      className="w-full h-10"
                    />
                    <div className="flex items-center overflow-hidden bg-white border rounded border-slate-300">
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const newSize = Math.max(
                            5,
                            (selectedObject.fontSize || 34) - 2,
                          );
                          selectedObject.set("fontSize", newSize);
                          canvas.renderAll();
                          setSelectedObject({
                            ...selectedObject,
                            fontSize: newSize,
                          });
                          syncWrapPreviewFromCanvas(true);
                        }}
                        className="px-2 py-1 text-black border-r bg-slate-100 hover:bg-slate-200 border-slate-300"
                      >
                        <FaMinus size={10} />
                      </button>
                      <input
                        type="text"
                        value={selectedObject.fontSize || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val === "") {
                            setSelectedObject({
                              ...selectedObject,
                              fontSize: "",
                            });
                            return;
                          }
                          const num = parseInt(val);
                          selectedObject.set("fontSize", num);
                          canvas.renderAll();
                          setSelectedObject({
                            ...selectedObject,
                            fontSize: num,
                          });
                          if (canvas._liveSyncTimeout)
                            clearTimeout(canvas._liveSyncTimeout);
                          canvas._liveSyncTimeout = setTimeout(
                            () => syncWrapPreviewFromCanvas(true),
                            300,
                          );
                        }}
                        className="w-full px-1 text-sm font-bold text-center text-black outline-none"
                      />
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const newSize = (selectedObject.fontSize || 34) + 2;
                          selectedObject.set("fontSize", newSize);
                          canvas.renderAll();
                          setSelectedObject({
                            ...selectedObject,
                            fontSize: newSize,
                          });
                          syncWrapPreviewFromCanvas(true);
                        }}
                        className="px-2 py-1 text-black border-l bg-slate-100 hover:bg-slate-200 border-slate-300"
                      >
                        <FaPlus size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 mb-3">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleDeleteSelected}
                  className="py-2 text-xs transition-colors border border-white/50 hover:bg-red-500/20"
                >
                  Delete
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleObjectDuplicate}
                  className="py-2 text-xs transition-colors border border-white/50 hover:bg-white/10"
                >
                  Duplicate
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleObjectForward}
                  className="py-2 text-xs transition-colors border border-white/50 hover:bg-white/10"
                >
                  Front
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleObjectBackward}
                  className="py-2 text-xs transition-colors border border-white/50 hover:bg-white/10"
                >
                  Back
                </button>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-xs font-bold">Opacity:</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.01"
                  className="w-full"
                  value={selectedObject?.opacity || 1}
                  onChange={(e) => {
                    if (!selectedObject) return;
                    selectedObject.set("opacity", Number(e.target.value));
                    canvas.renderAll();
                  }}
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleImageUpload}
              />
              <input
                type="file"
                ref={editorBgInputRef}
                hidden
                accept="image/*"
                onChange={handleEditorBackgroundUpload}
              />
            </div>
          </div>

          <div className="mt-4 bg-white rounded-[18px] p-4 shadow-sm">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black uppercase text-slate-500">
                  Quantity
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.max(template.moq || 1, q - 1))
                    }
                    className="border rounded-lg w-9 h-9"
                  >
                    -
                  </button>
                  <span className="font-black text-center min-w-8">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="border rounded-lg w-9 h-9"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex items-center w-full gap-3 md:w-auto">
                <button
                  onClick={() => handleAddToCart(false)}
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-[#111] text-white text-xs font-black uppercase tracking-[0.15em]"
                >
                  {loadingAction === "cart" ? "Saving..." : "Add To Cart"}
                </button>
                <button
                  onClick={() => handleAddToCart(true)}
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-[#2D5A27] text-white text-xs font-black uppercase tracking-[0.15em]"
                >
                  {loadingAction === "order"
                    ? "Preparing..."
                    : "Proceed To Buy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );

  if (!template) return <div className="p-20 text-center">Loading...</div>;
  if (isStrictWrapShapeCategory) {
    return (
      <>
        {WrapEditorLayout()}
        {previewModalOpen && PreviewModal()}
      </>
    );
  }

  const TabButton = ({ name, icon, label }) => (
    <button
      className={`flex-1 p-3 text-center border-b-2 font-medium transition-colors ${activeTab === name ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
      onClick={() => setActiveTab(name)}
    >
      <span className="block mb-1 text-xl">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );

  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 preview-overlay">
      <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative">
        {/* Header */}
        <div className="flex items-center justify-between px-8 bg-transparent border-b border-gray-100 py-7">
          <div className="font-sans">
            <h2
              className="text-[28px] font-[900] uppercase tracking-tighter m-0 text-[#1e293b] leading-tight"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              DESIGN PREVIEW
            </h2>
            <p
              className="  text-[10px] font-black uppercase tracking-[0.25em] mt-2 opacity-80 text-[#911805] "
              style={{ letterSpacing: "0.1em" }}
            >
              REVIEW YOUR CUSTOMIZATION BEFORE ORDERING
            </p>
          </div>
          <button
            onClick={() => setPreviewModalOpen(false)}
            className="flex items-center justify-center w-10 h-10 text-gray-400 transition-all duration-300 bg-white border border-gray-200 rounded-full shadow-sm hover:rotate-90 hover:bg-gray-100 hover:text-red-500"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content - SCROLLABLE AREA */}
        <div className="flex-1 p-6 overflow-y-auto bg-transparent md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left: Product Specs Sidebar */}
            <div className="space-y-6 lg:col-span-4">
              <div className="bg-[#f8fafc] rounded-[2.5rem] p-8 border border-slate-100">
                <h3
                  className="text-[11px] font-[900] uppercase tracking-[0.1em] text-[#911805] mb-8"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  PRODUCT TECHNICALS
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded-xl">
                    <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-wider">
                      PRODUCT
                    </span>
                    <span className="text-[13px] font-[900] text-[#1e293b]">
                      {template.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded-xl">
                    <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-wider">
                      CATEGORY
                    </span>
                    <Tag className="m-0 border-none px-4 font-black text-[9px] uppercase rounded-full bg-blue-100 text-blue-600">
                      {template.category}
                    </Tag>
                  </div>
                  {template.productSize && (
                    <div className="flex items-center justify-between p-2 bg-white/50 rounded-xl">
                      <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-wider">
                        CAPACITY/SIZE
                      </span>
                      <span className="text-[13px] font-[900] text-[#1e293b]">
                        {template.productSize}
                      </span>
                    </div>
                  )}
                  {template.printSize && (
                    <div className="flex items-center justify-between p-2 bg-white/50 rounded-xl">
                      <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-wider">
                        PRINT AREA
                      </span>
                      <span className="text-[13px] font-[900] text-[#1e293b]">
                        {template.printSize}
                      </span>
                    </div>
                  )}
                  <div className="pt-6 mt-6 space-y-3 border-t border-slate-200">
                    <div className="flex justify-between items-center text-[11px] font-bold text-[#94a3b8]">
                      <span>Base Price</span>
                      <span className="text-[#1e293b] font-[900]">
                        ₹{template.basePrice}
                      </span>
                    </div>
                    {template.shippingCharges > 0 && (
                      <div className="flex justify-between items-center text-[11px] font-bold text-[#94a3b8]">
                        <span>Shipping Fee</span>
                        <span className="text-[#1e293b] font-[900]">
                          ₹{template.shippingCharges}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-200">
                      <span className="text-xs font-black text-[#94a3b8] uppercase tracking-widest">
                        EST. TOTAL
                      </span>
                      <span
                        className="text-[32px] font-[900] text-[#2D5A27] leading-none"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        ₹
                        {(
                          (template.basePrice +
                            (template.packingCharges || 0)) *
                            quantity +
                          (template.shippingCharges || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 rounded-[2rem] p-6 border border-blue-100/50">
                <p className="text-[11px] text-blue-600/70 font-bold leading-relaxed">
                  Kindly note: The colors on your screen may slightly differ
                  from the actual printed product due to screen calibration.
                </p>
              </div>
            </div>

            {/* Right: Visual Previews */}
            <div className="flex flex-col gap-6 lg:col-span-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Flat Design View */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 ml-4">
                    2D Design Layout
                  </span>
                  <div className="bg-gray-50 rounded-[2.5rem] min-h-[460px] md:min-h-[500px] flex items-center justify-center p-6 md:p-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-gray-200/20 to-transparent"></div>
                    <img
                      src={previewImage}
                      alt="Final"
                      className="max-h-[96%] max-w-[96%] object-contain drop-shadow-2xl z-10 transition-transform duration-500 group-hover:scale-105"
                    />
                    {template.overlayImageUrl && (
                      <img
                        src={template.overlayImageUrl}
                        alt="Mockup"
                        className="absolute inset-0 z-20 object-contain w-full h-full pointer-events-none opacity-40 mix-blend-multiply"
                      />
                    )}
                  </div>
                </div>

                {/* 3D View (If applicable) */}
                {(template?.wrapType === "mug" ||
                  template?.wrapType === "bottle" ||
                  template?.wrapType === "planter" ||
                  showMugPreview) && (
                  <div className="relative flex flex-col h-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="absolute z-20 top-4 right-4">
                      <button
                        onClick={() => setPreviewModalOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Again
                      </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4 min-h-[400px]">
                      <MugWrapPreview
                        photoUrl={mugPreviewUrl || previewImage}
                        mockupViews={template?.mockupViews}
                        slotAssets={isStrictWrapShapeCategory ? {} : slotAssets}
                        placeholderShapeBySide={previewShapeBySide}
                        wrapType={
                          template?.wrapType ||
                          (() => {
                            const cat = (template.category || "").toLowerCase();
                            if (cat.includes("mug")) return "mug";
                            if (cat.includes("sipper")) return "bottle";
                            if (cat.includes("bottle")) return "bottle";
                            if (cat.includes("planter")) return "planter";
                            if (cat.includes("case")) return "phone";
                            return "mug";
                          })()
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons - EXACTLY as per screenshot + Add to Cart */}
        <div className="flex flex-col gap-4 p-8 bg-transparent border-t border-gray-100 md:flex-row">
          <button
            onClick={() => setPreviewModalOpen(false)}
            className="flex-1 py-5 text-xs font-black tracking-widest text-gray-700 uppercase transition-all border-2 rounded-2xl border-slate-100 hover:bg-slate-50"
          >
            BACK TO EDITOR
          </button>

          <button
            onClick={() => {
              setPreviewModalOpen(false);
              handleAddToCart(true);
            }}
            className="flex-[2] py-5 rounded-2xl bg-[#187336] hover:bg-[#0a4b0e] text-white font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 text-xs"
          >
            PLACE ORDER SUCCESSFULLY <span className="text-xl">→</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Layout
        style={{
          minHeight: "calc(100vh - 80px)",
          background: "#F8F5F0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className={`absolute inset-0 pointer-events-none transition-all duration-1000 overflow-hidden -z-10`}
        >
          <div className="luxury-blob bg-luxury-gold/50 top-[-10%] left-[-5%] animate-float"></div>
          <div
            className="luxury-blob bg-luxury-green-light/40 bottom-[-5%] right-[-10%] animate-float"
            style={{ animationDelay: "-10s" }}
          ></div>
          <div
            className="luxury-blob bg-luxury-blue-light/30 top-1/2 left-1/2 animate-float"
            style={{ animationDelay: "-15s" }}
          ></div>
        </div>
        <Content
          style={{ padding: "24px 16px", position: "relative", zIndex: 10 }}
        >
          <div className="container mx-auto mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-8 py-3 bg-white border-none rounded-full text-[13px] font-[900] text-[#1e293b] hover:text-luxury-green transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] uppercase tracking-[0.15em] group"
            >
              <FaArrowLeft className="text-sm transition-transform group-hover:-translate-x-1" />{" "}
              GO BACK
            </button>
          </div>
          <div className="container mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-128px)] gap-6">
            <Card
              className="relative flex flex-col items-center justify-start flex-1"
              style={{ borderRadius: 20 }}
              bodyStyle={{ padding: 16, height: "100%", overflow: "visible" }}
            >
              {isStrictWrapShapeCategory ? (
                <div className="flex flex-col w-full h-full gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Live Product Preview
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {template.name}
                      </p>
                    </div>
                    <Button type="secondary" onClick={handlePreview}>
                      👁️ Preview
                    </Button>
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-[#202020] rounded-[2rem] p-4">
                    <div className="w-full max-w-[540px]">
                      <MugWrapPreview
                        photoUrl={mugPreviewUrl || previewImage || null}
                        mockupViews={template?.mockupViews}
                        slotAssets={{}}
                        placeholderShapeBySide={previewShapeBySide}
                        wrapType={
                          template?.wrapType ||
                          (() => {
                            const cat = (template.category || "").toLowerCase();
                            if (cat.includes("mug")) return "mug";
                            if (cat.includes("sipper")) return "bottle";
                            if (cat.includes("bottle")) return "bottle";
                            if (cat.includes("planter")) return "planter";
                            if (cat.includes("case")) return "phone";
                            return "mug";
                          })()
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-start gap-4 p-2 pt-[160px]">
                  <div className="flex items-center justify-between w-full px-2 max-w-[380px]">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      {editorSide === "front"
                        ? "Front Live Preview"
                        : editorSide === "back"
                          ? "Back Live Preview"
                          : "Live Preview"}
                    </p>
                    {isFlatProduct && (
                      <span
                        className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                          isKeychain
                            ? "bg-violet-100 text-violet-700"
                            : isCoaster
                              ? "bg-amber-100 text-amber-700"
                              : isFridgeMagnet
                                ? "bg-sky-100 text-sky-700"
                                : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {isCircularVariant
                          ? "⬤ Round"
                          : isHeartVariant
                            ? "♥ Heart"
                            : "■ Square/Rect"}
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-full flex items-center justify-center bg-transparent mt-2`}
                  >
                    {(() => {
                      const containerStyle = `shadow-2xl border-4 border-white bg-white inline-block rounded-3xl overflow-hidden w-full max-w-[420px]`;
                      const imgStyle = `w-full h-auto object-contain transition-all duration-500`;

                      return previewImage ? (
                        <div className={containerStyle}>
                          <img
                            src={previewImage}
                            alt="Your Design"
                            className={imgStyle}
                          />
                        </div>
                      ) : template?.previewImage ? (
                        <div className={containerStyle}>
                          <img
                            src={template.previewImage}
                            alt={template.name}
                            className={imgStyle}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 gap-3 p-8 text-center bg-gray-50/80 rounded-2xl w-full max-w-[380px]">
                          <span className="text-5xl">🖼️</span>
                          <p className="text-sm font-bold">
                            Upload a photo to see preview
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <button
                    onClick={handlePreview}
                    className="mt-4 px-6 py-3 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    👁️ Full Preview
                  </button>
                </div>
              )}
            </Card>

            <Card
              className="w-full lg:w-[400px] flex flex-col h-full"
              style={{ borderRadius: 20 }}
              bodyStyle={{
                padding: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="p-4 border-b group">
                <Title level={4} style={{ marginBottom: 4 }}>
                  {template.name}
                </Title>
                <div className="flex items-center justify-between">
                  <Text
                    className="text-lg font-black"
                    style={{ color: "#2D5A27" }}
                    strong
                  >
                    ₹{template.basePrice + (template.packingCharges || 0)}
                  </Text>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                      {template.shippingCharges > 0
                        ? `+ ₹${template.shippingCharges} Shipping`
                        : "FREE Delivery"}
                    </span>
                    {template.packingCharges > 0 && (
                      <span className="text-[9px] text-gray-300 font-bold italic">
                        Inc. Packing Charges
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {isStrictWrapShapeCategory ? (
                  <div className="space-y-4">
                    <div className="rounded-[1.8rem] bg-[#2a2a2a] text-white p-4 shadow-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                            Design Editor
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Layout size (mm): {template.printSize || "Not set"}
                          </p>
                        </div>
                        <button
                          onClick={handlePreview}
                          className="px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-[10px] font-black uppercase tracking-wider hover:bg-white/20 transition-all"
                        >
                          Preview
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => cycleEditorSide(-1)}
                          className="flex items-center justify-center w-10 h-10 transition-all border rounded-xl border-white/15 bg-white/10 hover:bg-white/20"
                        >
                          <FaChevronLeft />
                        </button>
                        <div className="flex-1 py-2 text-center border rounded-xl bg-black/20 border-white/10">
                          <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400">
                            Editing Side
                          </p>
                          <p className="text-sm font-black uppercase">
                            {editorSide === "front"
                              ? "Front Side"
                              : editorSide === "back"
                                ? "Back Side"
                                : editorSide}
                          </p>
                        </div>
                        <button
                          onClick={() => cycleEditorSide(1)}
                          className="flex items-center justify-center w-10 h-10 transition-all border rounded-xl border-white/15 bg-white/10 hover:bg-white/20"
                        >
                          <FaChevronRight />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {editorSides.map((side) => (
                          <button
                            key={side}
                            onClick={() => setEditorSide(side)}
                            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                              editorSide === side
                                ? "bg-white text-[#222] border-white"
                                : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            {side}
                          </button>
                        ))}
                      </div>

                      <div className="rounded-[1.5rem] border border-white/10 bg-[#1f1f1f] p-3">
                        <div className="rounded-[1rem] bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] p-3 flex items-center justify-center min-h-[320px]">
                          <div className="shadow-2xl border-[6px] border-white rounded-[1.2rem] bg-white inline-block max-w-full overflow-auto">
                            <canvas ref={canvasRef} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleEditorImageUpload}
                          className="flex items-center justify-center gap-2 py-3 text-sm font-black transition-all border rounded-xl border-white/20 bg-white/5 hover:bg-white/10"
                        >
                          <FaImage /> Add Image
                        </button>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleEditorAddText}
                          className="flex items-center justify-center gap-2 py-3 text-sm font-black transition-all border rounded-xl border-white/20 bg-white/5 hover:bg-white/10"
                        >
                          <FaFont /> Add Text
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {["left", "center", "right"].map((side) => (
                          <button
                            key={`upload-${side}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => uploadImageForSide(side)}
                            className={`py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                              editorSide === side
                                ? "bg-white text-[#222] border-white"
                                : "bg-white/5 text-gray-300 border-white/15 hover:bg-white/10"
                            }`}
                          >
                            Upload {side}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">
                        Editor Notes
                      </p>
                      <div className="px-3 py-3 text-sm border border-gray-200 rounded-xl bg-slate-50 text-slate-600">
                        `Add Image` current side ke print canvas me image
                        dalega. `Add Text` editable text object canvas me
                        dalega.
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">
                        Image ko canvas par drag/resize karo. Text par double
                        click ya select karke directly canvas me edit karo.
                      </p>
                      {currentSideAsset?.imageUrl && (
                        <p className="text-[10px] text-green-600 font-bold mt-2 uppercase tracking-wide">
                          Image added on {editorSide}
                        </p>
                      )}
                      {currentSideAsset?.text && (
                        <p className="text-[10px] text-indigo-600 font-bold mt-1 uppercase tracking-wide">
                          Text active on {editorSide}
                        </p>
                      )}
                    </div>

                    {selectedObject && (
                      <div className="p-5 space-y-4 bg-white border shadow-sm border-slate-200 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Selected Layer Tools
                        </p>

                        {selectedObject.role === "clipped-image" && (
                          <div className="pb-4 border-b border-slate-100">
                            <label className="flex justify-between items-center text-[10px] font-black text-indigo-600 uppercase mb-2">
                              <span>Photo Zoom</span>
                              <span>
                                {Math.round(
                                  (selectedObject.scaleX /
                                    (selectedObject.maskRef?.getScaledWidth() /
                                      selectedObject.width)) *
                                    100,
                                )}
                                %
                              </span>
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="3"
                              step="0.01"
                              className="w-full account-slider accent-indigo-600"
                              value={
                                selectedObject.scaleX /
                                (selectedObject.maskRef?.getScaledWidth() /
                                  selectedObject.width)
                              }
                              onChange={(e) => {
                                const zoom = parseFloat(e.target.value);
                                const mask = selectedObject.maskRef;
                                const mW = mask.getScaledWidth();
                                const mH = mask.getScaledHeight();
                                const minScaleX = mW / selectedObject.width;
                                const minScaleY = mH / selectedObject.height;
                                const minScale = Math.max(minScaleX, minScaleY);
                                const newScale = minScale * zoom;
                                selectedObject.set({
                                  scaleX: newScale,
                                  scaleY: newScale,
                                });
                                handleImageTransformation({
                                  target: selectedObject,
                                });
                                canvas.renderAll();
                              }}
                            />
                          </div>
                        )}

                        {(selectedObject.type === "i-text" ||
                          selectedObject.type === "text") && (
                          <div className="space-y-3">
                            <textarea
                              value={selectedObject.text || ""}
                              onChange={(e) => {
                                selectedObject.set("text", e.target.value);
                                canvas.renderAll();
                                if (selectedObject.role === "side-text") {
                                  const slot =
                                    selectedObject.sideSlot || "center";
                                  setPhotoTextValue(e.target.value);
                                  setSlotAssets((prev) => ({
                                    ...prev,
                                    [slot]: {
                                      ...prev[slot],
                                      text: e.target.value,
                                    },
                                  }));
                                }
                              }}
                              rows={3}
                              className="w-full p-3 border rounded-xl"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="color"
                                value={selectedObject.fill || "#000000"}
                                onChange={(e) => {
                                  selectedObject.set("fill", e.target.value);
                                  canvas.renderAll();
                                  setSelectedObject({
                                    ...selectedObject,
                                    fill: e.target.value,
                                  });
                                }}
                                className="w-full border cursor-pointer h-11 rounded-xl"
                              />
                              <div className="flex items-center overflow-hidden bg-white border border-slate-300 rounded-xl h-11">
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    const newSize = Math.max(
                                      5,
                                      (selectedObject.fontSize || 34) - 2,
                                    );
                                    selectedObject.set("fontSize", newSize);
                                    canvas.renderAll();
                                    setSelectedObject({
                                      ...selectedObject,
                                      fontSize: newSize,
                                    });
                                  }}
                                  className="h-full px-3 text-black border-r bg-slate-100 hover:bg-slate-200 border-slate-300"
                                >
                                  <FaMinus size={12} />
                                </button>
                                <input
                                  type="text"
                                  value={selectedObject.fontSize || ""}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(
                                      /\D/g,
                                      "",
                                    );
                                    if (val === "") {
                                      setSelectedObject({
                                        ...selectedObject,
                                        fontSize: "",
                                      });
                                      return;
                                    }
                                    const num = parseInt(val);
                                    selectedObject.set("fontSize", num);
                                    canvas.renderAll();
                                    setSelectedObject({
                                      ...selectedObject,
                                      fontSize: num,
                                    });
                                  }}
                                  className="w-full px-1 text-sm font-bold text-center text-black bg-white outline-none"
                                />
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    const newSize =
                                      (selectedObject.fontSize || 34) + 2;
                                    selectedObject.set("fontSize", newSize);
                                    canvas.renderAll();
                                    setSelectedObject({
                                      ...selectedObject,
                                      fontSize: newSize,
                                    });
                                  }}
                                  className="h-full px-3 text-black border-l bg-slate-100 hover:bg-slate-200 border-slate-300"
                                >
                                  <FaPlus size={12} />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => {
                                  selectedObject.set(
                                    "fontWeight",
                                    selectedObject.fontWeight === "bold"
                                      ? "normal"
                                      : "bold",
                                  );
                                  canvas.renderAll();
                                }}
                                className="p-2 text-xs font-black border rounded-xl"
                              >
                                Bold
                              </button>
                              <button
                                onClick={() => {
                                  selectedObject.set(
                                    "fontStyle",
                                    selectedObject.fontStyle === "italic"
                                      ? "normal"
                                      : "italic",
                                  );
                                  canvas.renderAll();
                                }}
                                className="p-2 text-xs font-black border rounded-xl"
                              >
                                Italic
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    typeof selectedObject.enterEditing ===
                                    "function"
                                  )
                                    selectedObject.enterEditing();
                                  canvas.setActiveObject(selectedObject);
                                  canvas.renderAll();
                                }}
                                className="p-2 text-xs font-black border rounded-xl"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => {
                              canvas.remove(selectedObject);
                              setSelectedObject(null);
                              canvas.renderAll();
                            }}
                            className="p-3 bg-red-50 text-[10px] font-black uppercase text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
                          >
                            Remove Selected
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      hidden
                      onChange={handleImageUpload}
                    />
                  </div>
                ) : (
                  <>
                    {/* ── Category-specific Info Banner for flat products ────── */}
                    {isFlatProduct && (
                      <div
                        className={`rounded-2xl p-4 mb-4 -mx-4 border ${
                          isKeychain
                            ? "bg-violet-50 border-violet-200"
                            : isCoaster
                              ? "bg-amber-50 border-amber-200"
                              : isFridgeMagnet
                                ? "bg-sky-50 border-sky-200"
                                : "bg-rose-50 border-rose-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {isKeychain
                              ? "🔑"
                              : isCoaster
                                ? "☕"
                                : isFridgeMagnet
                                  ? "🧲"
                                  : "⭐"}
                          </span>
                          <div className="flex-1">
                            <p
                              className={`text-[11px] font-black uppercase tracking-wider ${
                                isKeychain
                                  ? "text-violet-700"
                                  : isCoaster
                                    ? "text-amber-700"
                                    : isFridgeMagnet
                                      ? "text-sky-700"
                                      : "text-rose-700"
                              }`}
                            >
                              {isKeychain
                                ? "MDF Keychain"
                                : isCoaster
                                  ? "MDF Coaster"
                                  : isFridgeMagnet
                                    ? "Fridge Magnet"
                                    : "Iron on Sticker"}
                              {isCircularVariant && " • Round"}
                              {isHeartVariant && " • Heart"}
                            </p>
                            <div className="flex flex-wrap mt-1 gap-x-4 gap-y-1">
                              {template.productSize && (
                                <span className="text-[9px] text-slate-500 font-bold">
                                  📦 Size:{" "}
                                  <span className="text-slate-800">
                                    {template.productSize}
                                  </span>
                                </span>
                              )}
                              {template.printSize && (
                                <span className="text-[9px] text-slate-500 font-bold">
                                  🖨️ Print:{" "}
                                  <span className="text-slate-800">
                                    {template.printSize}
                                  </span>
                                </span>
                              )}
                              {template.moq && (
                                <span className="text-[9px] text-slate-500 font-bold">
                                  🛒 MOQ:{" "}
                                  <span className="text-slate-800">
                                    {isCoaster
                                      ? "2 / 4 / 6 / 8"
                                      : isIronOnSticker
                                        ? `${template.moq} (×4)`
                                        : template.moq}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Design Canvas ────────────────────────────────────────── */}
                    <div className="bg-[#181818] rounded-2xl p-3 mb-4 -mx-4 -mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
                          Design Canvas
                          {printSizeMm
                            ? ` • ${Math.round(printSizeMm.widthMm)}×${Math.round(printSizeMm.heightMm)}mm`
                            : ""}
                        </p>
                        <p className="text-[9px] text-gray-500">
                          Drag &amp; resize to edit
                        </p>
                      </div>
                      <div className="bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] rounded-xl flex items-center justify-center p-2 min-h-[260px] overflow-auto">
                        <div
                          className={`shadow-xl border-4 border-white bg-white inline-block ${isCircularVariant ? "rounded-full overflow-hidden" : isHeartVariant ? "rounded-2xl" : "rounded-xl"}`}
                        >
                          <canvas ref={canvasRef} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          onClick={() => {
                            setActiveUploadSlot("center");
                            fileInputRef.current.click();
                          }}
                          className="py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all text-white text-xs font-black flex items-center justify-center gap-2"
                        >
                          📷 Add Image
                        </button>
                        <button
                          onClick={() =>
                            addToCanvas(
                              new fabric.IText("Your Text", {
                                fontFamily: "Arial",
                                fontSize: 24,
                                fill: "#1e293b",
                              }),
                            )
                          }
                          className="py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all text-white text-xs font-black flex items-center justify-center gap-2"
                        >
                          T Add Text
                        </button>
                      </div>
                      {/* Text controls when text object selected */}
                      {selectedObject &&
                        (selectedObject.type === "i-text" ||
                          selectedObject.type === "text") && (
                          <div className="pt-3 mt-3 space-y-2 border-t border-white/10">
                            <p className="text-[9px] text-gray-400 font-black uppercase">
                              Text Settings
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="color"
                                value={selectedObject.fill || "#000000"}
                                onChange={(e) => {
                                  selectedObject.set("fill", e.target.value);
                                  canvas.renderAll();
                                }}
                                className="w-full border-0 cursor-pointer h-9 rounded-xl"
                              />
                              <input
                                type="number"
                                min="8"
                                max="200"
                                value={selectedObject.fontSize || 24}
                                onChange={(e) => {
                                  selectedObject.set(
                                    "fontSize",
                                    Number(e.target.value),
                                  );
                                  canvas.renderAll();
                                }}
                                className="w-full px-2 text-sm text-black bg-white border rounded-xl"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => {
                                  selectedObject.set(
                                    "fontWeight",
                                    selectedObject.fontWeight === "bold"
                                      ? "normal"
                                      : "bold",
                                  );
                                  canvas.renderAll();
                                }}
                                className="py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black"
                              >
                                Bold
                              </button>
                              <button
                                onClick={() => {
                                  selectedObject.set(
                                    "fontStyle",
                                    selectedObject.fontStyle === "italic"
                                      ? "normal"
                                      : "italic",
                                  );
                                  canvas.renderAll();
                                }}
                                className="py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black"
                              >
                                Italic
                              </button>
                              <button
                                onClick={() => {
                                  canvas.remove(selectedObject);
                                  setSelectedObject(null);
                                  canvas.renderAll();
                                }}
                                className="py-1.5 rounded-lg bg-red-500/30 text-red-300 text-[10px] font-black"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      {/* Image zoom/delete controls when image selected */}
                      {selectedObject &&
                        (selectedObject.role === "clipped-image" ||
                          selectedObject.role === "free-image") && (
                          <div className="pt-3 mt-3 border-t border-white/10">
                            <label className="text-[9px] text-gray-400 font-black uppercase mb-1 block">
                              Image Zoom
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="0.01"
                              className="w-full accent-indigo-400"
                              value={
                                selectedObject.role === "clipped-image" &&
                                selectedObject.maskRef
                                  ? selectedObject.scaleX /
                                    Math.max(
                                      0.001,
                                      selectedObject.maskRef.getScaledWidth() /
                                        selectedObject.width,
                                    )
                                  : selectedObject.scaleX || 1
                              }
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (
                                  selectedObject.role === "clipped-image" &&
                                  selectedObject.maskRef
                                ) {
                                  const mW =
                                    selectedObject.maskRef.getScaledWidth();
                                  const mH =
                                    selectedObject.maskRef.getScaledHeight();
                                  const minS = Math.max(
                                    mW / selectedObject.width,
                                    mH / selectedObject.height,
                                  );
                                  selectedObject.set({
                                    scaleX: minS * v,
                                    scaleY: minS * v,
                                  });
                                } else {
                                  selectedObject.set({ scaleX: v, scaleY: v });
                                }
                                canvas.renderAll();
                              }}
                            />
                            <button
                              onClick={() => {
                                canvas.remove(selectedObject);
                                setSelectedObject(null);
                                canvas.renderAll();
                              }}
                              className="mt-2 w-full py-1.5 rounded-lg bg-red-500/30 text-red-300 text-[10px] font-black"
                            >
                              Remove Image
                            </button>
                          </div>
                        )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        hidden
                        onChange={handleImageUpload}
                      />
                    </div>
                    {/* ── Emoji section ────────────────────────────────────────── */}
                    <div className="flex mb-4 -mx-4 border-b bg-gray-50">
                      <TabButton name="image" icon="📷" label="Upload More" />
                      <TabButton name="emoji" icon="😊" label="Emoji" />
                    </div>
                    {activeTab === "image" && (
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setActiveUploadSlot("center");
                            fileInputRef.current.click();
                          }}
                          className="flex items-center justify-center w-full gap-2 py-4 text-sm font-black text-indigo-600 transition-all border-2 border-indigo-400 border-dashed rounded-xl hover:bg-indigo-50"
                        >
                          📷 Upload Another Photo
                        </button>
                      </div>
                    )}
                    {activeTab === "emoji" && (
                      <EmojiPicker
                        onEmojiClick={(d) =>
                          addToCanvas(
                            new fabric.IText(d.emoji, { fontSize: 50 }),
                          )
                        }
                        width="100%"
                        height={300}
                      />
                    )}
                  </>
                )}
              </div>

              <div className="p-6 border-t space-y-5 bg-white shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
                {/* Quantity Selector UI */}
                <div className="flex items-center justify-between p-5 border bg-slate-50/80 rounded-2xl border-slate-100/50">
                  <div>
                    <span className="text-[11px] font-[900] text-slate-400 uppercase tracking-widest leading-none">
                      Quantity
                    </span>
                    {moqStep > 1 && (
                      <p className="text-[9px] text-amber-500 font-bold mt-0.5">
                        Steps of {moqStep} only
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-5 bg-white rounded-xl shadow-sm p-1.5 border border-slate-100">
                    <button
                      onClick={() =>
                        setQuantity((q) =>
                          Math.max(template.moq || 1, q - moqStep),
                        )
                      }
                      className="flex items-center justify-center w-10 h-10 transition-colors rounded-lg hover:bg-slate-50 text-slate-800 disabled:opacity-30"
                      disabled={quantity <= (template.moq || 1)}
                    >
                      <FaMinus size={12} />
                    </button>
                    <span className="w-10 text-center font-[900] text-slate-900 text-[18px]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + moqStep)}
                      className="flex items-center justify-center w-10 h-10 transition-colors rounded-lg hover:bg-slate-50 text-slate-800"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                </div>

                {/* Order Summary breakdown */}
                <div className="px-2 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                    <span>Product price (x{quantity})</span>
                    <span className="font-bold text-slate-900">
                      ₹{(template.basePrice * quantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                    <span>Packing Charges</span>
                    <span className="font-bold text-slate-900">
                      + ₹
                      {(
                        (template.packingCharges || 0) * quantity
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                    <span>Shipping Charges</span>
                    <span
                      className={
                        template.shippingCharges === 0
                          ? "text-green-600 font-bold"
                          : "text-slate-900 font-bold"
                      }
                    >
                      {template.shippingCharges === 0
                        ? "FREE"
                        : `+ ₹${(template.shippingCharges || 0).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-1 border-t-2 border-dashed border-slate-100">
                    <span className="text-xs font-[900] text-slate-900 uppercase tracking-[0.2em]">
                      EST. TOTAL
                    </span>
                    <span
                      className="text-[32px] font-[900] text-[#2D5A27] leading-none"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      ₹
                      {(
                        (template.basePrice + (template.packingCharges || 0)) *
                          quantity +
                        (template.shippingCharges || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-3">
                  <Button
                    block
                    type="primary"
                    disabled={!!loadingAction}
                    onClick={() => handleAddToCart(false)}
                    className="h-[60px] font-black transition-all hover:-translate-y-1 active:scale-[0.98]"
                    style={{
                      background: "#111",
                      borderColor: "#111",
                      borderRadius: "18px",
                      fontSize: "13px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    {loadingAction === "cart" ? "SAVING..." : "ADD TO CART"}
                  </Button>
                  <Button
                    block
                    type="primary"
                    disabled={!!loadingAction}
                    onClick={() => {
                      if (canvas) {
                        handleAddToCart(true);
                      } else {
                        navigate(`/checkout?id=${template._id}`);
                      }
                    }}
                    className="h-[68px] font-black transition-all hover:-translate-y-1 active:scale-[0.98] shadow-2xl shadow-green-100"
                    style={{
                      background: "#2D5A27",
                      borderColor: "#2D5A27",
                      borderRadius: "18px",
                      fontSize: "15px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    {loadingAction === "order"
                      ? "PREPARING..."
                      : "PROCEED TO BUY"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Content>
      </Layout>

      {previewModalOpen && PreviewModal()}
    </>
  );
};

export default CustomizeProduct;
