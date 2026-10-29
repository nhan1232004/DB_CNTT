import { documentsService } from './documents.service.ts';
import { sendSuccess, sendError } from '../../core/response.ts';
import type { RouteHandler } from '../../core/types.ts';

export const getDocumentsHandler: RouteHandler = (_req, res) => {
  try {
    const docs = documentsService.getAllDocuments();
    sendSuccess(res, { items: docs, total: docs.length }, 'Danh mục biểu mẫu và quy định thực tập TDTU');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi lấy danh mục tài liệu');
  }
};

export const getDocumentByIdHandler: RouteHandler = (req, res) => {
  try {
    const { id } = req.params;
    const doc = documentsService.getDocumentById(id);
    if (!doc) {
      sendError(res, 404, `Không tìm thấy tài liệu với mã: ${id}`, 'DOCUMENT_NOT_FOUND');
      return;
    }
    sendSuccess(res, doc, 'Chi tiết tài liệu');
  } catch (err: any) {
    sendError(res, 500, err?.message || 'Lỗi tìm tài liệu');
  }
};
