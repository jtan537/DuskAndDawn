using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Yarn.Unity;

public class TempDoneTutorial : MonoBehaviour
{
    VariableStorageBehaviour _varStorage;
    [SerializeField]
    GameObject dawnStartPoint, duskStartPoint, tutorial_plane;
    GameObject dusk, dawn;

    [SerializeField]
    bool skipTutorial = false;
    void Start()
    {
        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
        dusk = GameObject.Find("Dusk");
        dawn = GameObject.Find("Dawn");
    }

    private void Update()
    {
        bool doneTutorial = _varStorage.GetValue("$done_tutorial").AsBool;
        if (doneTutorial || (skipTutorial))
        {
            dusk.GetComponent<CharacterController>().enabled = false;
            dawn.GetComponent<CharacterController>().enabled = false;
            dusk.transform.position = duskStartPoint.transform.position;
            dawn.transform.position = dawnStartPoint.transform.position;
            dusk.GetComponent<CharacterController>().enabled = true;
            dawn.GetComponent<CharacterController>().enabled = true;

            tutorial_plane.SetActive(false);
            gameObject.GetComponent<TempDoneTutorial>().enabled = false;
        }
    }


}
