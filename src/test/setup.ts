import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Realiza cleanup após cada teste para evitar leak de estado da DOM entre testes
afterEach(() => {
    cleanup();
});
