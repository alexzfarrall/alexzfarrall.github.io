import { initReveal } from './reveal';
import { initResearchFilter } from './research-filter';
import { initMoreBatch } from './more-batch';
import { initProblemBoxes } from './problem-box';
import { initSeal } from './seal';
import { initFundersSpan } from './funders-span';
import { initFeaturedToggle } from './featured-toggle';
import { initProjectDialog } from './project-dialog';

initReveal();
initResearchFilter(document.querySelector<HTMLElement>('[data-research]'));
initMoreBatch(document.querySelector<HTMLElement>('[data-research]'));
initProblemBoxes();
initSeal();
initFundersSpan();
initFeaturedToggle();
initProjectDialog();
