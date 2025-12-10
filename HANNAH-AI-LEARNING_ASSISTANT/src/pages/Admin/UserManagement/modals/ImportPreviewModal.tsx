import React from 'react';
import { createPortal } from 'react-dom';
import { type ParsedResult } from '../../../../utils/userImport';

interface ImportPreviewModalProps {
    showImportModal: boolean;
    importResult: ParsedResult | null;
    selectedFileName: string;
    onClose: () => void;
    onApplyImport: () => void;
}

const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
    showImportModal,
    importResult,
    selectedFileName,
    onClose,
    onApplyImport
}) => {
    if (!showImportModal || !importResult) return null;

    return createPortal(
        (
            <div className="modal-overlay">
                <div className="modal">
                    <h3>Import users from Excel/CSV</h3>
                    <div>
                        <p><strong>File:</strong> {selectedFileName}</p>
                        <p>
                            Valid: <strong>{importResult.valid.length}</strong> rows
                            {importResult.invalid.length > 0 && (
                                <>
                                    {' '}| Errors: <strong style={{ color: '#d32f2f' }}>{importResult.invalid.length}</strong> rows
                                </>
                            )}
                        </p>
                        {importResult.invalid.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <p style={{ margin: '8px 0' }}>Some example errors:</p>
                                <ul style={{ maxHeight: 160, overflowY: 'auto', paddingLeft: 18 }}>
                                    {importResult.invalid.slice(0, 5).map((inv, i) => (
                                        <li key={i}>
                                            Row {inv.rowNumber}: {inv.errors.join('; ')}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="modal-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            Close
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={importResult.valid.length === 0}
                            onClick={onApplyImport}
                        >
                            {`Add ${importResult.valid.length} users`}
                        </button>
                    </div>
                </div>
            </div>
        ),
        document.body
    );
};

export default ImportPreviewModal;
