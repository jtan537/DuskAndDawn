using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class Dialog : MonoBehaviour
{
    public TextMeshProUGUI textDisplay;
    public string[] sentences;
    private int index;
    public float typingSpeed;
    public GameObject continueButton;
    public GameObject yesButton;
    public GameObject noButton;
    public GameObject dialogText;

    private float distance;

    void Update(){
        if (textDisplay.text == sentences[index]){
            if (index == sentences.Length - 2)
            {
                yesButton.SetActive(true);
                noButton.SetActive(true);
            }
            else if (index < sentences.Length - 1)
            {
                continueButton.SetActive(true);
            }
        }
    }

    public IEnumerator Type(){
        dialogText.SetActive(true);
    	foreach(char letter in sentences[index].ToCharArray()){
    		textDisplay.text += letter;
    		yield return new WaitForSeconds(typingSpeed);
    	}
    }

    public void NextSentence(){
        continueButton.SetActive(false);
        yesButton.SetActive(false);
        noButton.SetActive(false);

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
        continueButton.SetActive(false);
        yesButton.SetActive(false);
        noButton.SetActive(false);
        dialogText.SetActive(false);
    }
}
