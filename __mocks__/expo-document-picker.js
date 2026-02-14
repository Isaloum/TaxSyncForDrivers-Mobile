export const getDocumentAsync = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [{ uri: 'file:///mock/document.csv', name: 'document.csv' }],
});
