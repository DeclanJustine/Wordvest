from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader


def load_pdfs(directory):
    loader = DirectoryLoader(
        directory,
        glob="**/*.pdf",
        loader_cls=PyPDFLoader,
        show_progress=True,
    )
    return loader.load()
