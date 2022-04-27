const saveToFile = (filename, text, saveAs = "plain") => {
    const pom = document.createElement('a');
    pom.setAttribute('href', `data:text/${saveAs};charset=utf-8,${encodeURIComponent(text)}`);
    pom.setAttribute('download', filename);
    pom.click();
}