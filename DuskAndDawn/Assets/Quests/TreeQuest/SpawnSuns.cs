using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Yarn.Unity;

public class SpawnSuns : MonoBehaviour
{
    VariableStorageBehaviour _varStorage;
    bool _initiatedDialog, _spawned;
    // Start is called before the first frame update
    void Start()
    {
        _spawned = false;
        DeactivateSuns();
        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
    }

    // Update is called once per frame
    void Update()
    {
        _initiatedDialog = _varStorage.GetValue("$quest_activated").AsBool;
        if (!_spawned && _initiatedDialog)
        {
            ActivateSuns();
        }
    }

    private void DeactivateSuns()
    {
        foreach (Transform child in transform)
        {
            child.gameObject.SetActive(false);
        }
    }

    private void ActivateSuns()
    {
        foreach (Transform child in transform)
        {
            child.gameObject.SetActive(true);
        }
        _spawned = true;
    }
}
