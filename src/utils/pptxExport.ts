import pptxgen from 'pptxgenjs';
import { SlideItem } from '../types';

/**
 * Helper to fetch an image as a base64 Data URI through the proxy
 * ensuring real offline image embedding into .pptx files.
 */
async function fetchImageAsDataUri(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  // If it's already a data URI, return it directly
  if (imageUrl.startsWith('data:')) return imageUrl;

  try {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const json = await res.json();
    return json.dataUri || null;
  } catch (err) {
    console.warn('Failed to fetch image for PPTX offline embedding:', err);
    return null;
  }
}

export interface PptxExportOptions {
  slides: SlideItem[];
  deckTitle?: string;
  onProgress?: (progressText: string) => void;
}

/**
 * Generates a real Microsoft PowerPoint (.pptx) file with embedded offline images,
 * custom multi-layout templates, typography, speaker notes, and diagram layouts.
 */
export async function exportToPowerPoint({
  slides,
  deckTitle = 'SmartSpeak Executive Presentation Deck',
  onProgress,
}: PptxExportOptions): Promise<void> {
  if (!slides || slides.length === 0) {
    throw new Error('No slides available to export.');
  }

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 13.33 x 7.5 inches standard widescreen
  pres.title = deckTitle;
  pres.author = 'SmartSpeak AI';
  pres.company = 'SmartSpeak Content Platform';

  const total = slides.length;

  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    const slideNum = i + 1;
    if (onProgress) {
      onProgress(`Embedding images & designing slide ${slideNum} of ${total}...`);
    }

    const pptSlide = pres.addSlide();

    // Dark Executive Canvas Background
    pptSlide.background = { color: '0B1120' };

    // Decorative top header accent line
    pptSlide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.12,
      fill: { color: '0EA5E9' },
      line: { color: '0EA5E9', width: 0 },
    });

    // Slide Number & Watermark Footer
    pptSlide.addText(`Slide ${slideNum} of ${total}  |  SmartSpeak Executive AI Deck`, {
      x: 0.8,
      y: 7.0,
      w: 8.0,
      h: 0.35,
      fontSize: 10,
      color: '64748B',
      fontFace: 'Arial',
    });

    pptSlide.addText('CONFIDENTIAL & PROPRIETARY', {
      x: 9.0,
      y: 7.0,
      w: 3.5,
      h: 0.35,
      align: 'right',
      fontSize: 9,
      color: '475569',
      fontFace: 'Arial',
    });

    // Add Speaker Notes
    if (slide.speakerNotes) {
      pptSlide.addNotes(slide.speakerNotes);
    }

    // Fetch embedded base64 image data for offline durability
    let base64Image: string | null = null;
    if (slide.imageUrl) {
      base64Image = await fetchImageAsDataUri(slide.imageUrl);
    }

    const slideType = slide.slideType || (i === 0 ? 'title' : 'content-with-image');

    // -------------------------------------------------------------
    // SLIDE TYPE 1: TITLE SLIDE
    // -------------------------------------------------------------
    if (slideType === 'title' || i === 0) {
      // Badge category
      pptSlide.addText('STRATEGIC BRIEFING & EXECUTIVE DECK', {
        x: 0.8,
        y: 1.2,
        w: 7.0,
        h: 0.35,
        fontSize: 11,
        bold: true,
        color: '38BDF8',
        fontFace: 'Arial',
      });

      // Main Title
      pptSlide.addText(slide.title, {
        x: 0.8,
        y: 1.6,
        w: 6.8,
        h: 2.0,
        fontSize: 28,
        bold: true,
        color: 'FFFFFF',
        fontFace: 'Arial',
        valign: 'top',
      });

      // Subtitle
      const sub = slide.subtitle || 'Automated Generative Analysis & Content Synthesis';
      pptSlide.addText(sub, {
        x: 0.8,
        y: 3.6,
        w: 6.8,
        h: 0.8,
        fontSize: 14,
        color: '94A3B8',
        fontFace: 'Arial',
      });

      // Bullets (Executive Context)
      const bullets = Array.isArray(slide.bulletPoints) ? slide.bulletPoints : [];
      if (bullets.length > 0) {
        const bulletObjects = bullets.map((b) => ({
          text: b,
          options: {
            fontSize: 13,
            color: 'CBD5E1',
            bullet: { type: 'bullet' as const, code: '25AA' },
            paraSpaceAfter: 8,
          },
        }));

        pptSlide.addText(bulletObjects, {
          x: 0.8,
          y: 4.5,
          w: 6.8,
          h: 2.2,
          valign: 'top',
        });
      }

      // Title Hero Image / Visual Panel (Right 45% of slide)
      if (base64Image) {
        pptSlide.addImage({
          data: base64Image,
          x: 8.0,
          y: 1.2,
          w: 4.5,
          h: 5.4,
          sizing: { type: 'cover', w: 4.5, h: 5.4 },
        });

        // Decorative border around image
        pptSlide.addShape(pres.ShapeType.rect, {
          x: 8.0,
          y: 1.2,
          w: 4.5,
          h: 5.4,
          fill: { color: '000000', transparency: 100 },
          line: { color: '38BDF8', width: 1.5 },
        });
      }
    }

    // -------------------------------------------------------------
    // SLIDE TYPE 2: PROCESS DIAGRAM
    // -------------------------------------------------------------
    else if (slideType === 'process-diagram') {
      // Header
      pptSlide.addText(`PHASE ARCHITECTURE  |  SLIDE 0${slideNum}`, {
        x: 0.8,
        y: 0.5,
        w: 8.0,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: '38BDF8',
      });

      pptSlide.addText(slide.title, {
        x: 0.8,
        y: 0.85,
        w: 8.5,
        h: 0.9,
        fontSize: 22,
        bold: true,
        color: 'FFFFFF',
      });

      // Steps flowboxes
      const steps = slide.diagramData?.steps || [
        { step: '01', title: 'Data Ingestion', desc: 'Synthesize core inputs' },
        { step: '02', title: 'Neural Processing', desc: 'Transformative structuring' },
        { step: '03', title: 'Verification', desc: 'Deploy with precision' },
      ];

      const stepWidth = 3.6;
      const stepGap = 0.4;
      const startX = 0.8;

      steps.slice(0, 3).forEach((st, sIdx) => {
        const xPos = startX + sIdx * (stepWidth + stepGap);
        // Step box
        pptSlide.addShape(pres.ShapeType.roundRect, {
          x: xPos,
          y: 2.0,
          w: stepWidth,
          h: 2.1,
          fill: { color: '1E293B' },
          line: { color: '0EA5E9', width: 1.2 },
          rectRadius: 0.1,
        });

        // Step number badge
        pptSlide.addText(st.step, {
          x: xPos + 0.25,
          y: 2.2,
          w: 0.8,
          h: 0.35,
          fontSize: 14,
          bold: true,
          color: '38BDF8',
        });

        // Step title
        pptSlide.addText(st.title, {
          x: xPos + 0.25,
          y: 2.65,
          w: stepWidth - 0.5,
          h: 0.5,
          fontSize: 14,
          bold: true,
          color: 'FFFFFF',
        });

        // Step description
        if (st.desc) {
          pptSlide.addText(st.desc, {
            x: xPos + 0.25,
            y: 3.2,
            w: stepWidth - 0.5,
            h: 0.75,
            fontSize: 11,
            color: '94A3B8',
          });
        }
      });

      // Bullets underneath
      const bullets = Array.isArray(slide.bulletPoints) ? slide.bulletPoints : [];
      if (bullets.length > 0) {
        const bulletObjects = bullets.map((b) => ({
          text: b,
          options: {
            fontSize: 12,
            color: 'CBD5E1',
            bullet: { type: 'bullet' as const, code: '2022' },
            paraSpaceAfter: 4,
          },
        }));

        pptSlide.addText(bulletObjects, {
          x: 0.8,
          y: 4.4,
          w: 7.5,
          h: 2.3,
          valign: 'top',
        });
      }

      // Small accompanying photo on right
      if (base64Image) {
        pptSlide.addImage({
          data: base64Image,
          x: 8.8,
          y: 4.4,
          w: 3.7,
          h: 2.3,
          sizing: { type: 'cover', w: 3.7, h: 2.3 },
        });

        pptSlide.addShape(pres.ShapeType.rect, {
          x: 8.8,
          y: 4.4,
          w: 3.7,
          h: 2.3,
          fill: { color: '000000', transparency: 100 },
          line: { color: '38BDF8', width: 1 },
        });
      }
    }

    // -------------------------------------------------------------
    // SLIDE TYPE 3: COMPARISON SLIDE
    // -------------------------------------------------------------
    else if (slideType === 'comparison') {
      // Header
      pptSlide.addText(`STRATEGIC COMPARISON  |  SLIDE 0${slideNum}`, {
        x: 0.8,
        y: 0.5,
        w: 8.0,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: '38BDF8',
      });

      pptSlide.addText(slide.title, {
        x: 0.8,
        y: 0.85,
        w: 8.5,
        h: 0.9,
        fontSize: 22,
        bold: true,
        color: 'FFFFFF',
      });

      // Comparison Table
      const rows = slide.diagramData?.comparisonRows || [
        { aspect: 'Execution Latency', left: 'Hours of Manual Drafting', right: 'Instantaneous Automated Synthesis' },
        { aspect: 'Accuracy & Fidelity', left: 'Subjective Inconsistency', right: 'Empirical Verification Guardrails' },
        { aspect: 'Scalability', left: 'Linear Resource Bottleneck', right: 'Infinite Multimodal Throughput' },
      ];

      const tableData = [
        [
          { text: 'Evaluation Dimension', options: { fill: { color: '1E293B' }, color: '38BDF8', bold: true, fontSize: 11 } },
          { text: 'Legacy Baseline', options: { fill: { color: '334155' }, color: 'CBD5E1', bold: true, fontSize: 11 } },
          { text: 'SmartSpeak AI Paradigm', options: { fill: { color: '0EA5E9' }, color: 'FFFFFF', bold: true, fontSize: 11 } },
        ],
        ...rows.map((r) => [
          { text: r.aspect, options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true, fontSize: 10 } },
          { text: r.left, options: { fill: { color: '1E293B' }, color: '94A3B8', fontSize: 10 } },
          { text: r.right, options: { fill: { color: '1E293B' }, color: '38BDF8', bold: true, fontSize: 10 } },
        ]),
      ];

      pptSlide.addTable(tableData, {
        x: 0.8,
        y: 2.0,
        w: 7.6,
        colW: [2.2, 2.7, 2.7],
        border: { pt: 1, color: '334155' },
      });

      // Bullets below table
      const bullets = Array.isArray(slide.bulletPoints) ? slide.bulletPoints : [];
      if (bullets.length > 0) {
        const bulletObjects = bullets.map((b) => ({
          text: b,
          options: {
            fontSize: 11,
            color: 'CBD5E1',
            bullet: { type: 'bullet' as const, code: '2022' },
            paraSpaceAfter: 4,
          },
        }));

        pptSlide.addText(bulletObjects, {
          x: 0.8,
          y: 4.8,
          w: 7.6,
          h: 1.9,
          valign: 'top',
        });
      }

      // Comparison right-side image
      if (base64Image) {
        pptSlide.addImage({
          data: base64Image,
          x: 8.8,
          y: 2.0,
          w: 3.7,
          h: 4.7,
          sizing: { type: 'cover', w: 3.7, h: 4.7 },
        });

        pptSlide.addShape(pres.ShapeType.rect, {
          x: 8.8,
          y: 2.0,
          w: 3.7,
          h: 4.7,
          fill: { color: '000000', transparency: 100 },
          line: { color: '38BDF8', width: 1 },
        });
      }
    }

    // -------------------------------------------------------------
    // SLIDE TYPE 4: CONTENT WITH IMAGE & CONCLUSION SUMMARY
    // -------------------------------------------------------------
    else {
      // Header
      pptSlide.addText(
        slideType === 'conclusion-summary'
          ? `STRATEGIC VERDICT  |  SLIDE 0${slideNum}`
          : `KEY ANALYSIS  |  SLIDE 0${slideNum}`,
        {
          x: 0.8,
          y: 0.5,
          w: 8.0,
          h: 0.3,
          fontSize: 10,
          bold: true,
          color: '38BDF8',
        }
      );

      pptSlide.addText(slide.title, {
        x: 0.8,
        y: 0.85,
        w: 6.8,
        h: 1.0,
        fontSize: 23,
        bold: true,
        color: 'FFFFFF',
        valign: 'top',
      });

      // Left Column Bullets
      const bullets = Array.isArray(slide.bulletPoints) ? slide.bulletPoints : [];
      if (bullets.length > 0) {
        const bulletObjects = bullets.map((b) => ({
          text: b,
          options: {
            fontSize: 13,
            color: 'CBD5E1',
            bullet: { type: 'bullet' as const, code: '2022' },
            paraSpaceAfter: 12,
          },
        }));

        pptSlide.addText(bulletObjects, {
          x: 0.8,
          y: 2.0,
          w: 6.5,
          h: 4.5,
          valign: 'top',
        });
      }

      // Visual Concept Note below bullets
      if (slide.visualConcept) {
        pptSlide.addText(`Visual Concept: ${slide.visualConcept}`, {
          x: 0.8,
          y: 6.4,
          w: 6.5,
          h: 0.45,
          fontSize: 9,
          italic: true,
          color: '64748B',
        });
      }

      // Right Column: Topic Embedded Image (Clean 16:9 proportioned image)
      if (base64Image) {
        pptSlide.addImage({
          data: base64Image,
          x: 7.7,
          y: 1.6,
          w: 4.8,
          h: 4.9,
          sizing: { type: 'cover', w: 4.8, h: 4.9 },
        });

        // Accent outline
        pptSlide.addShape(pres.ShapeType.rect, {
          x: 7.7,
          y: 1.6,
          w: 4.8,
          h: 4.9,
          fill: { color: '000000', transparency: 100 },
          line: { color: '38BDF8', width: 1.5 },
        });
      }
    }
  }

  if (onProgress) {
    onProgress('Finalizing PowerPoint file package...');
  }

  const cleanFileName = `SmartSpeak_${deckTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)}.pptx`;
  await pres.writeFile({ fileName: cleanFileName });
}
