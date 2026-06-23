import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock simple de window.confirm
window.confirm = vi.fn().mockReturnValue(true);
window.alert = vi.fn();
