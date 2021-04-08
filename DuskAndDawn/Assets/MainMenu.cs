using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class MainMenu : MonoBehaviour
{
    // Start is called before the first frame update
    public void PlayGame()
    {
        StartCoroutine(GameObject.FindObjectOfType<SceneLoader>().FadeAndLoadScene(SceneLoader.FadeDirection.In, "3d Scene Char"));
    }

    public void QuitGame()
    {
        Application.Quit();
    }
}
