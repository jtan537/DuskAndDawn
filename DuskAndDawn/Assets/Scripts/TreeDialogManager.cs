using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class TreeDialogManager : MonoBehaviour
{
    public TextMeshProUGUI textDisplay;
    public string[] sentences;
    private int index;
    public float typingSpeed;
    public GameObject dialogText;

    public IEnumerator Type(){
        dialogText.SetActive(true);
        foreach(char letter in sentences[index].ToCharArray()){
            textDisplay.text += letter;
            yield return new WaitForSeconds(typingSpeed);
        }
    }

    public void NextSentence(){
        if (index < sentences.Length - 1) {
            index++;
            textDisplay.text = "";
            StartCoroutine(Type());
        } else {
            textDisplay.text = "";
        }
    }

    public void clear(){
        textDisplay.text = "";
        index = 0;
        dialogText.SetActive(false);
    }
}
